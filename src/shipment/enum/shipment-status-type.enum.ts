export enum ShipmentStatusType {
  /**
   * The shipment has been created and is ready
   * to be transmitted to the courier
   */
  CREATED = 1,
  /**
   * The shipment has been accepted by the courier
   */
  CONFIRMED = 2,
  /**
   * The shipment has been rejected by the courier
   */
  FAILED = 3,
  /**
   * The shipment has been cancelled by the user after it had been confirmed
   */
  CANCELLED = 4,
  /**
   * The ASNs for the shipment's packing lists have been sent out
   */
  NOTIFIED = 5,
}
