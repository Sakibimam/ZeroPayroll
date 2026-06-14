export function generateRandomViewKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatSalary(cents) {
  if (typeof cents !== 'number') return '$0.00 USDC';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC`;
}

export function truncateAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
