import Papa from 'papaparse';

export async function importMembersFromCsv(file: string) {
  try {
    const response = await fetch(file);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Map headers to expected format
          const headerMap: { [key: string]: string } = {
            'id': 'id',
            'member_number': 'member_number',
            'collector_id': 'collector_id',
            'full_name': 'full_name',
            'date_of_birth': 'date_of_birth',
            'gender': 'gender',
            'marital_status': 'marital_status',
            'email': 'email',
            'phone': 'phone',
            'address': 'address',
            'postcode': 'postcode',
            'town': 'town',
            'verified': 'verified',
            'created_at': 'created_at',
            'updated_at': 'updated_at',
            'membership_type': 'membership_type'
          };
          
          return headerMap[header.toLowerCase()] || header.toLowerCase();
        },
        transform: (value, field) => {
          // Skip empty values
          if (!value || value === '' || value === 'Postcode Unknown' || value === 'Town Unknown') {
            return null;
          }
          
          // Handle date fields
          if (field === 'date_of_birth' && value) {
            try {
              // Handle UK date format (DD/MM/YYYY)
              if (value.includes('/')) {
                const [day, month, year] = value.split('/').map(Number);
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime())) {
                  return date.toISOString().split('T')[0];
                }
              }
              // Handle ISO format
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
              }
            } catch (error) {
              console.warn('Invalid date format:', value);
            }
            return null;
          }
          
          // Handle boolean values
          if (field === 'verified') {
            return value.toLowerCase() === 'true';
          }
          
          return value;
        },
        complete: (results) => {
          const cleanedData = results.data.map((row: any) => {
            // Remove empty fields and ensure required fields are present
            const cleanRow: any = {};
            Object.entries(row).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                cleanRow[key] = value;
              }
            });
            return cleanRow;
          });
          
          console.log('Parsed CSV data:', cleanedData);
          resolve(cleanedData);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching CSV:', error);
    throw error;
  }
}