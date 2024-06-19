/**
 * Line acks transition as follows
 *
 * PARTIAL->COMPLETE
 *
 * OBSOLETE
 */
export enum LineItemAcknowledgementStatusType {
  /**
   * The ack contains incomplete information.
   * It is not yet ready to be turned into a response
   */
  PARTIAL = 1,
  /**
   * The ack is complete with all the information needed to make
   * a response
   */
  COMPLETE = 2,
  /**
   * The ack was created ready, because the corresponding product
   * is obsolete
   */
  OBSOLETE = 3,
}
