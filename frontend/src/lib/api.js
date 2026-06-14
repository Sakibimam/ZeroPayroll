const API_BASE = '/api'

export async function submitPayroll(csvFile, masterViewKey) {
  const formData = new FormData();
  formData.append('file', csvFile);
  formData.append('master_view_key', masterViewKey);

  const response = await fetch(`${API_BASE}/submit-payroll`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit payroll');
  }
  return data;
}

export async function decryptSalary(walletAddress, employeeViewKey) {
  const response = await fetch(`${API_BASE}/decrypt-salary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress, employee_view_key: employeeViewKey }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to decrypt salary');
  }
  return data;
}

export async function auditPayroll(employerAddress, masterViewKey) {
  const response = await fetch(`${API_BASE}/audit-payroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employer_address: employerAddress, master_view_key: masterViewKey }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to audit payroll');
  }
  return data;
}
