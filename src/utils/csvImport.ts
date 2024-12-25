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
            'Name': 'full_name',
            'Full Name': 'full_name',
            'Address': 'address',
            'Postcode': 'postcode',
            'Town': 'town',
            'Date of Birth': 'date_of_birth',
            'Gender': 'gender',
            'Marital Status': 'marital_status',
            'Email': 'email',
            'Phone': 'phone',
            'Mobile': 'phone',
            'Verified': 'verified',
            'Collector': 'collector'
          };
          
          // Clean up header name
          const cleanHeader = header
            .replace(/^Unknown Author.*Author:\s*/, '')
            .replace(/\n/g, ' ')
            .trim();
            
          return headerMap[cleanHeader] || cleanHeader.toLowerCase();
        },
        transform: (value, field) => {
          // Handle special cases
          if (value === 'Postcode Unknown' || value === 'Town Unknown' || value === 'Unknown') {
            return null;
          }
          
          // Convert date format if needed
          if (field === 'date_of_birth' && value) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
              }
            } catch (error) {
              console.warn('Invalid date format:', value);
            }
            return null;
          }
          
          // Convert boolean values
          if (field === 'verified') {
            return value.toLowerCase() === 'true';
          }
          
          return value;
        },
        complete: (results) => {
          console.log('Parsed CSV data:', results.data);
          resolve(results.data);
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