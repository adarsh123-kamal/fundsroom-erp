/**
 * Generates a unique challan number in the format: CH-YYYYMMDD-XXXX
 * where XXXX is a zero-padded sequential number within the day.
 */
export function generateChallanNumber(sequenceNumber: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');
  return `CH-${year}${month}${day}-${seq}`;
}
