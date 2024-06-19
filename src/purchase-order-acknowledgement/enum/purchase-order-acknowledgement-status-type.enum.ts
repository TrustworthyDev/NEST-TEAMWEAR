/**
 * One PurchaseOrderAcknowledgement goes through the following states.
 * It is created as PARTIAL or COMPLETE, depending on the order it
 * is for. Once it's COMPLETE, it may be sent out and become FORWARDED.
 *
 * Receiving response messages for already COMPLETE or FORWARDED
 * Acknowledgements is allowed. Although it doesn't modify them,
 * it can be used to output the acknowledgment again.
 *
 * PARTIAL?->COMPLETE->FORWARDED
 */
export enum PurchaseOrderAcknowledgementStatusType {
  /**
   * Some items are not yet acknowledged
   */
  PARTIAL = 1,
  /**
   * All items are acknowledged
   */
  COMPLETE = 2,
  /**
   * The acknowledgement has been sent out
   */
  FORWARDED = 3,
}
