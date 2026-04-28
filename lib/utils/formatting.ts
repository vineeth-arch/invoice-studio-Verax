const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numberToWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ONES[n % 10] : "");
  if (n < 1000) {
    const rem = n % 100;
    return ONES[Math.floor(n / 100)] + " Hundred" + (rem !== 0 ? " " + numberToWords(rem) : "");
  }
  if (n < 100000) {
    const rem = n % 1000;
    return numberToWords(Math.floor(n / 1000)) + " Thousand" + (rem !== 0 ? " " + numberToWords(rem) : "");
  }
  if (n < 10000000) {
    const rem = n % 100000;
    return numberToWords(Math.floor(n / 100000)) + " Lakh" + (rem !== 0 ? " " + numberToWords(rem) : "");
  }
  const rem = n % 10000000;
  return numberToWords(Math.floor(n / 10000000)) + " Crore" + (rem !== 0 ? " " + numberToWords(rem) : "");
}

export function amountToWordsINR(amount: number): string {
  if (isNaN(amount) || amount < 0) return "";
  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let result = "Rupees ";
  if (rupees === 0 && paise === 0) return "Rupees Zero Only";
  if (rupees > 0) result += numberToWords(rupees);
  if (paise > 0) {
    result += (rupees > 0 ? " and " : "") + numberToWords(paise) + " Paise";
  }
  return result + " Only";
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatDate(dateStr: string | undefined, format = "DD MMM YYYY"): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const monthNum = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  switch (format) {
    case "DD/MM/YYYY": return `${day}/${monthNum}/${year}`;
    case "YYYY-MM-DD": return `${year}-${monthNum}-${day}`;
    default: return `${day} ${month} ${year}`;
  }
}
