const toNumber = (value) => Number(value || 0);

const mapOrderRow = (row) => ({
  id: row.id,
  orderNumber: row.order_number,
  trackingToken: row.tracking_token,
  customerName: row.customer_name,
  contactNumber: row.contact_number,
  email: row.email,
  fulfillmentMethod: row.fulfillment_method,
  notes: row.notes,
  status: row.status,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  paymentProvider: row.payment_provider,
  paymentReference: row.payment_reference,
  paymentUrl: row.payment_url,
  paidAt: row.paid_at,
  subtotal: toNumber(row.subtotal),
  total: toNumber(row.total),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapOrderItemRow = (row) => ({
  id: row.id,
  orderId: row.order_id,
  productId: row.product_id,
  productName: row.product_name,
  productImage: row.product_image,
  category: row.category,
  quantity: row.quantity,
  unitPrice: toNumber(row.unit_price),
  lineTotal: toNumber(row.line_total),
  serviceDetails: row.service_details || {},
  createdAt: row.created_at,
});

const mapOrderEventRow = (row) => ({
  id: row.id,
  orderId: row.order_id,
  eventType: row.event_type,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
});

const hydrateOrders = (orderRows, itemRows, eventRows = []) => {
  const itemsByOrderId = itemRows.reduce((accumulator, row) => {
    const mappedItem = mapOrderItemRow(row);

    if (!accumulator[mappedItem.orderId]) {
      accumulator[mappedItem.orderId] = [];
    }

    accumulator[mappedItem.orderId].push(mappedItem);
    return accumulator;
  }, {});

  const eventsByOrderId = eventRows.reduce((accumulator, row) => {
    const mappedEvent = mapOrderEventRow(row);

    if (!accumulator[mappedEvent.orderId]) {
      accumulator[mappedEvent.orderId] = [];
    }

    accumulator[mappedEvent.orderId].push(mappedEvent);
    return accumulator;
  }, {});

  return orderRows.map((row) => ({
    ...mapOrderRow(row),
    events: eventsByOrderId[row.id] || [],
    items: itemsByOrderId[row.id] || [],
  }));
};

module.exports = {
  hydrateOrders,
  mapOrderEventRow,
  mapOrderItemRow,
  mapOrderRow,
};
