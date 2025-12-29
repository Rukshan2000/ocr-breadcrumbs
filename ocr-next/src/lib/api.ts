/**
 * OCR Ticket API Service
 * Handles all communication with the backend API
 */

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:5001/api/ocr/tickets';

/**
 * Test if API is reachable
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('🔗 API connection test:', response.ok ? '✅ Connected' : '❌ Failed');
    return response.ok;
  } catch (error) {
    console.error('🔗 API connection failed:', error);
    return false;
  }
}

export interface ScannedData {
  extracted_text: string;
  confidence: number;
}

export interface TicketPayload {
  date: string;
  time: string;
  terminal_id: string;
  location: string;
  no_tickets: number;
  total_amount: string;
  trace_no: string;
  reference_no: string;
  ticket_amount_pp: string;
  ticket_img_path?: string;
  scanned_data: ScannedData;
}

export interface TicketResponse {
  id: number;
  date: string;
  time: string;
  terminal_id: string;
  location: string;
  no_tickets: number;
  total_amount: string;
  trace_no: string;
  reference_no: string;
  ticket_amount_pp: string;
  ticket_img_path: string | null;
  scanned_data: ScannedData;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Create a new ticket in the database
 */
export async function createTicket(ticketData: TicketPayload): Promise<TicketResponse> {
  try {
    console.log('🔵 Creating ticket at:', API_BASE_URL);
    console.log('📦 Request body:', ticketData);
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
      credentials: 'include',
    });

    console.log('📊 Response status:', response.status);
    console.log('✓ Response ok:', response.ok);

    const result = await response.json();
    console.log('✅ Response data:', result);

    if (!response.ok) {
      const errorMsg = result.error || result.message || `HTTP ${response.status}: Failed to create ticket`;
      throw new Error(errorMsg);
    }

    if (!result.data) {
      throw new Error('No data returned from server');
    }

    return result.data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error creating ticket:', errorMsg);
    throw new Error(`Failed to save ticket: ${errorMsg}`);
  }
}

/**
 * Create a new ticket with image upload to S3
 * Sends FormData containing binary image and ticket metadata
 * @param formData - FormData with 'image' (File) and 'data' (JSON string) fields
 */
export async function createTicketWithImage(formData: FormData): Promise<TicketResponse> {
  try {
    console.log('🔵 Uploading ticket with image to:', `${API_BASE_URL}/with-image`);
    console.log('📦 FormData prepared');
    
    // Get image size for logging
    const imageFile = formData.get('image');
    if (imageFile instanceof File) {
      console.log('📸 Image size:', imageFile.size, 'bytes');
      console.log('📸 Image type:', imageFile.type);
    }

    const response = await fetch(`${API_BASE_URL}/with-image`, {
      method: 'POST',
      // NOTE: Don't set Content-Type header - browser will set it with boundary
      body: formData,
      credentials: 'include',
    });

    console.log('📊 Response status:', response.status);
    console.log('✓ Response ok:', response.ok);

    const result = await response.json();
    console.log('✅ Response data:', result);

    if (!response.ok) {
      const errorMsg = result.error || result.message || `HTTP ${response.status}: Failed to upload ticket with image`;
      throw new Error(errorMsg);
    }

    if (!result.data) {
      throw new Error('No data returned from server');
    }

    console.log('✅ Image uploaded successfully to S3');
    console.log('📁 S3 Path:', result.data.ticket_img_path);

    return result.data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error uploading ticket with image:', errorMsg);
    throw new Error(`Failed to save ticket with image: ${errorMsg}`);
  }
}

/**
 * Get all tickets with pagination
 */
export async function getAllTickets(
  limit: number = 10,
  offset: number = 0
): Promise<ApiResponse<TicketResponse[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch tickets');
    }

    return result;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}

/**
 * Get a specific ticket by ID
 */
export async function getTicketById(id: number): Promise<TicketResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch ticket');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
}

/**
 * Get ticket by trace number
 */
export async function getTicketByTraceNo(traceNo: string): Promise<TicketResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/trace/${traceNo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch ticket');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching ticket by trace number:', error);
    throw error;
  }
}

/**
 * Get total count of tickets
 */
export async function getTicketCount(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch ticket count');
    }

    return result.data.count;
  } catch (error) {
    console.error('Error fetching ticket count:', error);
    throw error;
  }
}

/**
 * Search tickets by date range
 */
export async function searchTicketsByDateRange(
  startDate: string,
  endDate: string
): Promise<TicketResponse[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/search/date-range?startDate=${startDate}&endDate=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to search tickets');
    }

    return result.data;
  } catch (error) {
    console.error('Error searching tickets:', error);
    throw error;
  }
}

/**
 * Update a ticket
 */
export async function updateTicket(id: number, updates: Partial<TicketPayload>): Promise<TicketResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update ticket');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
}

/**
 * Delete a ticket
 */
export async function deleteTicket(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete ticket');
    }
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
}
