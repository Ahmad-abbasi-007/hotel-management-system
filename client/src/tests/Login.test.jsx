import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthContext } from '../context/AuthContext';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() }
}));

import api from '../api/axios';

const renderLogin = () => {
  return render(
    <AuthContext.Provider value={{ user: null, login: vi.fn(), logout: vi.fn() }}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login form with email, password and button', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows hotel login heading', () => {
    renderLogin();
    expect(screen.getByText(/hotel login/i)).toBeInTheDocument();
  });

  test('calls api on submit with typed values', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'fake', name: 'A', email: 'a@a.com', role: 'guest' }
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'pass1234' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@test.com',
      password: 'pass1234'
    });
  });
});