export enum AppEvents {
  /**
   * An order was created
   * @param purchaseOrderNumber
   * @param amazonVendorCode
   */
  ORDER_CREATE = 'order-create',
  /**
   * The order-items-mexal for an order were created
   * @param purchaseOrderNumber
   * @param amazonVendorCode
   */
  ORDER_ITEMS_MEXAL_CREATE = 'order-items-mexal-create',
  /**
   * The order-items-mexal for an order were forwarded to mexal
   * @param purchaseOrderNumber
   * @param amazonVendorCode
   */
  ORDER_ITEMS_MEXAL_FORWARD = 'order-items-mexal-forward',
  /**
   * A purchase order acknowledgement message needs to be evaluated.
   * @param orderResponseMessageIn
   */
  PURCHASE_ORDER_ACKNOWLEDGEMENT_MESSAGE = 'purchase-order-acknowledgement-message',
  /**
   * All of the LineItemAcknoledgements for an order are complete.
   * The Acknowledgement is ready to be sent back to partner
   * @param purchaseOrderNumber
   */
  PURCHASE_ORDER_ACKNOWLEDGEMENT_COMPLETE = 'purchase-order-acknowledgement-complete',
  /**
   * @param invoiceNumber The invoice number of the invoice that was issued.
   */
  INVOICE_ISSUED = 'invoice-issued',
  /**
   * @param shipmentId The id of the newly-creared shipment
   */
  SHIPMENT_CREATE = 'shipment-create',
  /**
   * @param shipmentId The id of the confirmed shipment
   */
  SHIPMENT_CONFIRM = 'shipment-confirm',
}
