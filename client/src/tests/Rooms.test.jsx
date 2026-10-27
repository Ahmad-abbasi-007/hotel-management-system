import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Rooms from '../pages/Rooms';
import { AuthContext } from '../context/AuthContext';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() }
}));

import api from '../api/axios';

const renderRooms = () => {
  return render(
    <AuthContext.Provider value={{ user: { name: 'G', role: 'guest' }, login: vi.fn(), logout: vi.fn() }}>
      <BrowserRouter>
        <Rooms />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Rooms Page', () => {
  test('shows loading then rooms list', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        { _id: '1', roomNumber: '101', type: 'Single', price: 5000, capacity: 2, status: 'Available' }
      ]
    });

    renderRooms();

    await waitFor(() => {
      expect(screen.getByText(/Room 101/)).toBeInTheDocument();
    });
    expect(screen.getByText(/PKR 5000/)).toBeInTheDocument();
  });

  test('shows empty state when no rooms', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    renderRooms();
    await waitFor(() => {
      expect(screen.getByText(/koi room nahi mila/i)).toBeInTheDocument();
    });
  });

  test('shows both room types when filtered list has two', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        { _id: '1', roomNumber: '101', type: 'Single', price: 5000, capacity: 2, status: 'Available' },
        { _id: '2', roomNumber: '102', type: 'Suite', price: 15000, capacity: 4, status: 'Available' }
      ]
    });

    renderRooms();

    await waitFor(() => expect(screen.getByText(/Room 101/)).toBeInTheDocument());
    expect(screen.getByText(/Room 102/)).toBeInTheDocument();
  });
});