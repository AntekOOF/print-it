const ordersService = require('../services/orders.service');
const { createHttpError } = require('../utils/httpError');
const {
  validateFilters,
  validateOrderId,
  validateOrderPayload,
  validateOrderStatusPayload,
  validatePaymentStatusPayload,
  validateTrackingPayload,
  validateTrackingToken,
} = require('../utils/validation');

const listOrders = async (request, response, next) => {
  try {
    const filters = validateFilters(request.query);
    const orders = await ordersService.listOrders(filters);
    response.json({ data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (request, response, next) => {
  try {
    const orderId = validateOrderId(request.params.orderId);
    const order = await ordersService.getOrderById(orderId);

    if (!order) {
      throw createHttpError(404, 'Order not found.');
    }

    response.json({ data: order });
  } catch (error) {
    next(error);
  }
};

const getPublicOrder = async (request, response, next) => {
  try {
    const trackingToken = validateTrackingToken(request.params.trackingToken);
    const order = await ordersService.getOrderByTrackingToken(trackingToken);

    if (!order) {
      throw createHttpError(404, 'Order not found.');
    }

    response.json({ data: order });
  } catch (error) {
    next(error);
  }
};

const trackOrder = async (request, response, next) => {
  try {
    const trackingPayload = validateTrackingPayload(request.body);
    const order = await ordersService.trackOrder(trackingPayload);

    if (!order) {
      throw createHttpError(404, 'No order matched the provided details.');
    }

    response.json({ data: order });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (request, response, next) => {
  try {
    const orderPayload = validateOrderPayload(request.body);
    const createdOrder = await ordersService.createOrder(orderPayload);
    response.status(201).json({
      data: createdOrder,
      message: 'Order submitted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (request, response, next) => {
  try {
    const orderId = validateOrderId(request.params.orderId);
    const status = validateOrderStatusPayload(request.body);
    const updatedOrder = await ordersService.updateOrderStatus(orderId, status);
    response.json({
      data: updatedOrder,
      message: 'Order status updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (request, response, next) => {
  try {
    const orderId = validateOrderId(request.params.orderId);
    const paymentStatus = validatePaymentStatusPayload(request.body);
    const updatedOrder = await ordersService.updatePaymentStatus(orderId, paymentStatus);
    response.json({
      data: updatedOrder,
      message: 'Payment status updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const getOrderSummary = async (_request, response, next) => {
  try {
    const summary = await ordersService.getOrderSummary();
    response.json({ data: summary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderSummary,
  getPublicOrder,
  listOrders,
  trackOrder,
  updatePaymentStatus,
  updateOrderStatus,
};
