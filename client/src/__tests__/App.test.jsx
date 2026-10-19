import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';

describe('CampusSphere Frontend Component & Routing Tests', () => {
  it('Renders Landing Page with CampusSphere Brand and Tagline', () => {
    render(<App />);
    expect(screen.getAllByText(/CampusSphere/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Your Campus,/i)).toBeInTheDocument();
  });

  it('Renders Instant Demo Login options', () => {
    render(<App />);
    expect(screen.getByText(/Instant Demo Login/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Student/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Campus Admin/i).length).toBeGreaterThan(0);
  });
});
