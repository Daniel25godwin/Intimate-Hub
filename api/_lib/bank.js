// Where customers send their transfer. Set these in Vercel → Environment Variables:
//   BANK_NAME, BANK_ACCOUNT_NUMBER, BANK_ACCOUNT_NAME
export function bankDetails() {
  return {
    bankName: process.env.BANK_NAME || "",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
    accountName: process.env.BANK_ACCOUNT_NAME || "",
  };
}
