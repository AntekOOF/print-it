const db = require('../db/pool');
const { createHttpError } = require('../utils/httpError');
const { hydrateOrders } = require('../utils/orderFormatters');
const { sendOrderCreatedEmail, sendOrderStatusEmail } = require('./mail.service');
const { uploadFile } = require('./media.service');
const {
  createCheckoutSession,
  generateTrackingToken,
  hasPaymongoConfiguration,
} = require('./payments.service');

const ORDER_FIELDS_SQL = `
  id,
  user_id,
  order_number,
  tracking_token,
  customer_name,
  contact_number,
  email,
  fulfillment_method,
  notes,
  status,
  payment_method,
  payment_status,
  payment_provider,
  payment_reference,
  payment_proof_name,
  payment_proof_url,
  payment_proof_uploaded_at,
  payment_url,
  paid_at,
  subtotal,
  total,
  created_at,
  updated_at
`;

const ORDER_ITEM_FIELDS_SQL = `
  id,
  order_id,
  product_id,
  product_name,
  product_image,
  category,
  quantity,
  unit_price,
  line_total,
  service_details,
  created_at
`;

const ORDER_EVENT_FIELDS_SQL = `
  id,
  order_id,
  event_type,
  title,
  description,
  created_at
`;

const formatLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const loadItemsForOrders = async (runner, orderIds) => {
  if (!orderIds.length) {
    return [];
  }

  const itemsResult = await runner.query(
    `
      SELECT ${ORDER_ITEM_FIELDS_SQL}
      FROM order_items
      WHERE order_id = ANY($1::int[])
      ORDER BY created_at ASC, id ASC
    `,
    [orderIds],
  );

  return itemsResult.rows;
};

const loadEventsForOrders = async (runner, orderIds) => {
  if (!orderIds.length) {
    return [];
  }

  const eventsResult = await runner.query(
    `
      SELECT ${ORDER_EVENT_FIELDS_SQL}
      FROM order_events
      WHERE order_id = ANY($1::int[])
      ORDER BY created_at ASC, id ASC
    `,
    [orderIds],
  );

  return eventsResult.rows;
};

const getOrdersFromResult = async (runner, orderRows) => {
  if (!orderRows.length) {
    return [];
  }

  const orderIds = orderRows.map((row) => row.id);
  const [items, events] = await Promise.all([loadItemsForOrders(runner, orderIds), loadEventsForOrders(runner, orderIds)]);

  return hydrateOrders(orderRows, items, events);
};

const getOrderByField = async (fieldName, value, existingRunner) => {
  const runner = existingRunner || db;
  const orderResult = await runner.query(
    `
      SELECT ${ORDER_FIELDS_SQL}
      FROM orders
      WHERE ${fieldName} = $1
      LIMIT 1
    `,
    [value],
  );

  if (!orderResult.rows[0]) {
    return null;
  }

  const orders = await getOrdersFromResult(runner, orderResult.rows);
  return orders[0];
};

const getOrderById = async (orderId, existingRunner) => getOrderByField('id', orderId, existingRunner);

const getOrderByTrackingToken = async (trackingToken, existingRunner) =>
  getOrderByField('tracking_token', trackingToken, existingRunner);

const getRawOrderRowById = async (orderId, existingRunner) => {
  const runner = existingRunner || db;
  const orderResult = await runner.query(
    `
      SELECT ${ORDER_FIELDS_SQL}
      FROM orders
      WHERE id = $1
      LIMIT 1
    `,
    [orderId],
  );

  return orderResult.rows[0] || null;
};

const buildOrderFilters = (filters) => {
  const values = [];
  const clauses = [];

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`status = $${values.length}`);
  }

  if (filters.paymentStatus) {
    values.push(filters.paymentStatus);
    clauses.push(`payment_status = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    clauses.push(`(order_number ILIKE $${values.length} OR customer_name ILIKE $${values.length} OR contact_number ILIKE $${values.length})`);
  }

  if (filters.dateFrom) {
    values.push(filters.dateFrom);
    clauses.push(`DATE(created_at) >= $${values.length}::date`);
  }

  if (filters.dateTo) {
    values.push(filters.dateTo);
    clauses.push(`DATE(created_at) <= $${values.length}::date`);
  }

  return {
    values,
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
  };
};

const recordOrderEvent = async (runner, orderId, event) => {
  await runner.query(
    `
      INSERT INTO order_events (order_id, event_type, title, description)
      VALUES ($1, $2, $3, $4)
    `,
    [orderId, event.eventType, event.title, event.description || null],
  );
};

const buildStatusDescription = (status) => {
  switch (status) {
    case 'pending':
      return 'The order is queued and waiting for staff confirmation.';
    case 'preparing':
      return 'The team has started preparing the items or print job.';
    case 'ready':
      return 'The order is ready for pickup or handoff.';
    case 'completed':
      return 'The order has been completed successfully.';
    case 'cancelled':
      return 'The order was cancelled and should no longer be fulfilled.';
    default:
      return 'The order status was updated.';
  }
};

const buildPaymentDescription = (paymentStatus, paymentMethod) => {
  switch (paymentStatus) {
    case 'awaiting_payment':
      return paymentMethod === 'manual_gcash'
        ? 'Waiting for the customer to send a manual GCash transfer.'
        : 'Waiting for the customer to complete payment.';
    case 'paid':
      return 'Payment has been confirmed.';
    case 'failed':
      return 'Payment attempt failed.';
    case 'expired':
      return 'The payment window expired before completion.';
    case 'refunded':
      return 'Payment was refunded.';
    case 'pending':
      return 'Payment will be collected during fulfillment.';
    default:
      return 'Payment status was updated.';
  }
};

const listOrders = async (filters = {}) => {
  const { values, whereClause } = buildOrderFilters(filters);
  const ordersResult = await db.query(
    `
      SELECT ${ORDER_FIELDS_SQL}
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC
    `,
    values,
  );

  return getOrdersFromResult(db, ordersResult.rows);
};

const listOrdersByUser = async (userId) => {
  const ordersResult = await db.query(
    `
      SELECT ${ORDER_FIELDS_SQL}
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return getOrdersFromResult(db, ordersResult.rows);
};

const getOrderSummary = async () => {
  const { rows } = await db.query(
    `
      SELECT
        COUNT(*)::int AS total_orders,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
        COUNT(*) FILTER (WHERE status = 'preparing')::int AS preparing_orders,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders,
        COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_orders,
        COALESCE(SUM(total), 0) AS total_booked,
        COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0) AS total_paid,
        COALESCE(SUM(total) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) AS booked_today,
        COALESCE(SUM(total) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '6 days'), 0) AS booked_this_week,
        COALESCE(SUM(total) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '29 days'), 0) AS booked_this_month,
        COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND DATE(created_at) = CURRENT_DATE), 0) AS paid_today,
        COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND DATE(created_at) >= CURRENT_DATE - INTERVAL '6 days'), 0) AS paid_this_week,
        COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid' AND DATE(created_at) >= CURRENT_DATE - INTERVAL '29 days'), 0) AS paid_this_month
      FROM orders
    `,
  );

  return {
    bookedThisMonth: Number(rows[0].booked_this_month),
    bookedThisWeek: Number(rows[0].booked_this_week),
    bookedToday: Number(rows[0].booked_today),
    completedOrders: rows[0].completed_orders,
    paidOrders: rows[0].paid_orders,
    paidThisMonth: Number(rows[0].paid_this_month),
    paidThisWeek: Number(rows[0].paid_this_week),
    paidToday: Number(rows[0].paid_today),
    pendingOrders: rows[0].pending_orders,
    preparingOrders: rows[0].preparing_orders,
    totalBooked: Number(rows[0].total_booked),
    totalOrders: rows[0].total_orders,
    totalPaid: Number(rows[0].total_paid),
  };
};

const ensureFoodAvailability = async (client, preparedItem) => {
  if (preparedItem.category !== 'Food') {
    return;
  }

  if (preparedItem.stockQuantity !== null && preparedItem.quantity > preparedItem.stockQuantity) {
    throw createHttpError(400, `${preparedItem.productName} only has ${preparedItem.stockQuantity} left in stock.`);
  }

  if (preparedItem.dailyLimit !== null) {
    const soldTodayResult = await client.query(
      `
        SELECT COALESCE(SUM(order_items.quantity), 0)::int AS quantity
        FROM order_items
        JOIN orders ON orders.id = order_items.order_id
        WHERE order_items.product_id = $1
          AND DATE(orders.created_at) = CURRENT_DATE
      `,
      [preparedItem.productId],
    );

    const soldToday = soldTodayResult.rows[0].quantity;

    if (soldToday + preparedItem.quantity > preparedItem.dailyLimit) {
      throw createHttpError(400, `${preparedItem.productName} has reached its daily availability limit.`);
    }
  }
};

const reserveFoodStock = async (client, preparedItems) => {
  for (const item of preparedItems) {
    if (item.category !== 'Food' || item.stockQuantity === null) {
      continue;
    }

    await client.query(
      `
        UPDATE products
        SET stock_quantity = stock_quantity - $2, updated_at = NOW()
        WHERE id = $1
      `,
      [item.productId, item.quantity],
    );
  }
};

const attachPaymentSessionIfNeeded = async (order) => {
  if (order.paymentMethod !== 'gcash') {
    return order;
  }

  try {
    const session = await createCheckoutSession(order);
    await db.query(
      `
        UPDATE orders
        SET
          payment_provider = $2,
          payment_reference = $3,
          payment_url = $4,
          payment_status = 'awaiting_payment',
          updated_at = NOW()
        WHERE id = $1
      `,
      [order.id, session.provider, session.reference, session.checkoutUrl],
    );

    await recordOrderEvent(db, order.id, {
      eventType: 'payment_link_generated',
      title: 'GCash checkout generated',
      description: 'A hosted GCash checkout link is ready for the customer.',
    });

    return await getOrderById(order.id);
  } catch (error) {
    await db.query(
      `
        UPDATE orders
        SET payment_status = 'failed', updated_at = NOW()
        WHERE id = $1
      `,
      [order.id],
    );

    await recordOrderEvent(db, order.id, {
      eventType: 'payment_status',
      title: 'Payment Failed',
      description: 'The payment link could not be prepared.',
    });

    const failedOrder = await getOrderById(order.id);
    failedOrder.paymentError = error.message;
    return failedOrder;
  }
};

const createOrder = async (orderInput, authUser) => {
  if (!authUser?.sub) {
    throw createHttpError(401, 'Authentication is required to place an order.');
  }

  if (orderInput.paymentMethod === 'gcash' && !hasPaymongoConfiguration()) {
    throw createHttpError(503, 'GCash is not configured yet. Please add PayMongo credentials on the server.');
  }

  const client = await db.getClient();
  const trackingToken = generateTrackingToken();
  const paymentStatus =
    orderInput.paymentMethod === 'gcash' || orderInput.paymentMethod === 'manual_gcash'
      ? 'awaiting_payment'
      : 'pending';

  try {
    await client.query('BEGIN');

    const productIds = orderInput.items.map((item) => item.productId);
    const productsResult = await client.query(
      `
        SELECT
          id,
          name,
          price,
          image,
          category,
          is_active,
          stock_quantity,
          daily_limit
        FROM products
        WHERE id = ANY($1::int[])
      `,
      [productIds],
    );

    const productMap = productsResult.rows.reduce((accumulator, row) => {
      accumulator[row.id] = row;
      return accumulator;
    }, {});

    const preparedItems = [];

    for (const item of orderInput.items) {
      const product = productMap[item.productId];

      if (!product) {
        throw createHttpError(400, `Product ${item.productId} no longer exists.`);
      }

      if (!product.is_active) {
        throw createHttpError(400, `${product.name} is currently unavailable.`);
      }

      const unitPrice = Number(product.price);
      const preparedItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        category: product.category,
        quantity: item.quantity,
        unitPrice,
        lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
        serviceDetails: item.serviceDetails,
        stockQuantity: product.stock_quantity,
        dailyLimit: product.daily_limit,
      };

      await ensureFoodAvailability(client, preparedItem);
      preparedItems.push(preparedItem);
    }

    const subtotal = Number(preparedItems.reduce((total, item) => total + item.lineTotal, 0).toFixed(2));
    const orderNumber = `PIT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${trackingToken.slice(0, 6).toUpperCase()}`;

    const orderResult = await client.query(
      `
        INSERT INTO orders (
          user_id,
          order_number,
          tracking_token,
          customer_name,
          contact_number,
          email,
          fulfillment_method,
          notes,
          status,
          payment_method,
          payment_status,
          payment_reference,
          subtotal,
          total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $12)
        RETURNING ${ORDER_FIELDS_SQL}
      `,
      [
        authUser.sub,
        orderNumber,
        trackingToken,
        authUser.fullName || orderInput.customerName,
        orderInput.contactNumber,
        authUser.email || orderInput.email || null,
        orderInput.fulfillmentMethod,
        orderInput.notes || null,
        orderInput.paymentMethod,
        paymentStatus,
        orderInput.paymentMethod === 'manual_gcash' ? orderInput.paymentReference || null : null,
        subtotal,
      ],
    );

    const order = orderResult.rows[0];

    for (const item of preparedItems) {
      await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            product_image,
            category,
            quantity,
            unit_price,
            line_total,
            service_details
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        `,
        [
          order.id,
          item.productId,
          item.productName,
          item.productImage,
          item.category,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
          JSON.stringify(item.serviceDetails || {}),
        ],
      );
    }

    await recordOrderEvent(client, order.id, {
      eventType: 'order_created',
      title: 'Order submitted',
      description: `Customer submitted an order with ${preparedItems.length} item${preparedItems.length === 1 ? '' : 's'}.`,
    });

    await recordOrderEvent(client, order.id, {
      eventType: 'payment_status',
      title: `Payment ${formatLabel(paymentStatus)}`,
      description: buildPaymentDescription(paymentStatus, orderInput.paymentMethod),
    });

    await reserveFoodStock(client, preparedItems);
    await client.query('COMMIT');

    let createdOrder = await getOrderById(order.id);

    if (createdOrder.paymentMethod === 'gcash') {
      createdOrder = await attachPaymentSessionIfNeeded(createdOrder);
    }

    sendOrderCreatedEmail(createdOrder).catch((error) => {
      console.error('Failed to send order confirmation email:', error.message);
    });

    return createdOrder;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const trackOrder = async ({ orderNumber, contactNumber }) => {
  const orderResult = await db.query(
    `
      SELECT ${ORDER_FIELDS_SQL}
      FROM orders
      WHERE UPPER(order_number) = UPPER($1)
        AND contact_number = $2
      LIMIT 1
    `,
    [orderNumber, contactNumber],
  );

  if (!orderResult.rows[0]) {
    return null;
  }

  const orders = await getOrdersFromResult(db, orderResult.rows);
  return orders[0];
};

const updateOrderStatus = async (orderId, status) => {
  const client = await db.getClient();
  let updatedOrder;

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `
        UPDATE orders
        SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING ${ORDER_FIELDS_SQL}
      `,
      [orderId, status],
    );

    if (!rows[0]) {
      throw createHttpError(404, 'Order not found.');
    }

    await recordOrderEvent(client, orderId, {
      eventType: 'order_status',
      title: `Order ${formatLabel(status)}`,
      description: buildStatusDescription(status),
    });

    await client.query('COMMIT');
    updatedOrder = await getOrderById(orderId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  sendOrderStatusEmail(updatedOrder, `Order status updated to ${status}`).catch((error) => {
    console.error('Failed to send order status email:', error.message);
  });

  return updatedOrder;
};

const updatePaymentStatus = async (orderId, paymentStatus) => {
  const client = await db.getClient();
  let updatedOrder;

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `
        UPDATE orders
        SET
          payment_status = $2::varchar,
          paid_at = CASE WHEN $2::varchar = 'paid' THEN COALESCE(paid_at, NOW()) ELSE NULL END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING ${ORDER_FIELDS_SQL}
      `,
      [orderId, paymentStatus],
    );

    if (!rows[0]) {
      throw createHttpError(404, 'Order not found.');
    }

    await recordOrderEvent(client, orderId, {
      eventType: 'payment_status',
      title: `Payment ${formatLabel(paymentStatus)}`,
      description: buildPaymentDescription(paymentStatus, rows[0].payment_method),
    });

    await client.query('COMMIT');
    updatedOrder = await getOrderById(orderId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  sendOrderStatusEmail(updatedOrder, `Payment status updated to ${paymentStatus}`).catch((error) => {
    console.error('Failed to send payment status email:', error.message);
  });

  return updatedOrder;
};

const uploadPaymentProof = async (orderId, proofInput, authUser) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const orderRow = await getRawOrderRowById(orderId, client);

    if (!orderRow) {
      throw createHttpError(404, 'Order not found.');
    }

    if (authUser?.role !== 'admin' && Number(orderRow.user_id) !== Number(authUser?.sub)) {
      throw createHttpError(403, 'You can only upload proof for your own orders.');
    }

    if (orderRow.payment_method !== 'manual_gcash') {
      throw createHttpError(400, 'Payment proof uploads are only available for manual GCash orders.');
    }

    if (orderRow.payment_status === 'paid') {
      throw createHttpError(400, 'This order is already marked as paid.');
    }

    const uploadedProof = await uploadFile({
      file: proofInput.file,
      folderName: 'payment-proofs',
    });

    const nextPaymentReference = proofInput.paymentReference || orderRow.payment_reference || null;

    await client.query(
      `
        UPDATE orders
        SET
          payment_reference = $2,
          payment_proof_name = $3,
          payment_proof_url = $4,
          payment_proof_uploaded_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [orderId, nextPaymentReference, uploadedProof.originalName, uploadedProof.assetPath],
    );

    await recordOrderEvent(client, orderId, {
      eventType: 'payment_proof',
      title: 'Payment proof uploaded',
      description: nextPaymentReference
        ? `Customer uploaded manual GCash proof with reference ${nextPaymentReference}.`
        : 'Customer uploaded manual GCash proof for verification.',
    });

    await client.query('COMMIT');
    return await getOrderById(orderId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const createOrRefreshCheckoutSession = async (trackingToken) => {
  const order = await getOrderByTrackingToken(trackingToken);

  if (!order) {
    throw createHttpError(404, 'Order not found.');
  }

  if (order.paymentMethod !== 'gcash') {
    throw createHttpError(400, 'This order does not use GCash payment.');
  }

  if (order.paymentStatus === 'paid') {
    return order;
  }

  const session = await createCheckoutSession(order);
  await db.query(
    `
      UPDATE orders
      SET
        payment_provider = $2,
        payment_reference = $3,
        payment_url = $4,
        payment_status = 'awaiting_payment',
        updated_at = NOW()
      WHERE id = $1
    `,
    [order.id, session.provider, session.reference, session.checkoutUrl],
  );

  await recordOrderEvent(db, order.id, {
    eventType: 'payment_link_generated',
    title: 'GCash checkout refreshed',
    description: 'A new hosted GCash payment link has been generated.',
  });

  return await getOrderByTrackingToken(trackingToken);
};

const resolveWebhookOrder = async (eventPayload) => {
  const eventAttributes = eventPayload?.data?.attributes || {};
  const resource = eventAttributes.data || {};
  const metadata = resource?.attributes?.metadata || resource?.attributes?.payments?.[0]?.attributes?.metadata || {};

  if (metadata.trackingToken) {
    return getOrderByTrackingToken(metadata.trackingToken);
  }

  if (metadata.orderId) {
    return getOrderById(Number(metadata.orderId));
  }

  if (resource.id) {
    const orderResult = await db.query(
      `
        SELECT ${ORDER_FIELDS_SQL}
        FROM orders
        WHERE payment_reference = $1
        LIMIT 1
      `,
      [resource.id],
    );

    if (!orderResult.rows[0]) {
      return null;
    }

    const orders = await getOrdersFromResult(db, orderResult.rows);
    return orders[0];
  }

  return null;
};

const handlePaymentWebhookEvent = async (eventPayload) => {
  const eventId = eventPayload?.data?.id;
  const eventType = eventPayload?.data?.attributes?.type;

  if (!eventId || !eventType) {
    throw createHttpError(400, 'Webhook payload is missing required fields.');
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const insertedEvent = await client.query(
      `
        INSERT INTO payment_webhook_events (provider, event_id, event_type, payload)
        VALUES ('paymongo', $1, $2, $3::jsonb)
        ON CONFLICT (provider, event_id) DO NOTHING
        RETURNING id
      `,
      [eventId, eventType, JSON.stringify(eventPayload)],
    );

    if (!insertedEvent.rows[0]) {
      await client.query('COMMIT');
      return;
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const order = await resolveWebhookOrder(eventPayload);

  if (!order) {
    return;
  }

  if (eventType === 'checkout_session.payment.paid' || eventType === 'payment.paid') {
    await db.query(
      `
        UPDATE orders
        SET
          payment_status = 'paid',
          paid_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [order.id],
    );

    await recordOrderEvent(db, order.id, {
      eventType: 'payment_status',
      title: 'Payment Paid',
      description: buildPaymentDescription('paid', order.paymentMethod),
    });

    const updatedOrder = await getOrderById(order.id);
    sendOrderStatusEmail(updatedOrder, 'GCash payment received').catch((error) => {
      console.error('Failed to send payment receipt email:', error.message);
    });
    return;
  }

  if (eventType === 'payment.failed') {
    await db.query(
      `
        UPDATE orders
        SET payment_status = 'failed', updated_at = NOW()
        WHERE id = $1
      `,
      [order.id],
    );

    await recordOrderEvent(db, order.id, {
      eventType: 'payment_status',
      title: 'Payment Failed',
      description: buildPaymentDescription('failed', order.paymentMethod),
    });
  }
};

module.exports = {
  createOrder,
  createOrRefreshCheckoutSession,
  getOrderById,
  getOrderByTrackingToken,
  getOrderSummary,
  handlePaymentWebhookEvent,
  listOrders,
  listOrdersByUser,
  trackOrder,
  uploadPaymentProof,
  updatePaymentStatus,
  updateOrderStatus,
};
