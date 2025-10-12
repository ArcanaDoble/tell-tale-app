import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as service from '../../services/libraryService';
import type { ResourceMeta } from '../../types/library';
import LibraryView from '../LibraryView';

describe('LibraryView', () => {
  it('muestra el listado de recursos desde Firebase', async () => {
    const mockResources: ResourceMeta[] = [
      {
        id: 'mock',
        title: 'Historia de prueba',
        description: 'Un recurso utilizado en pruebas.',
        author: 'Tester',
        coverUrl: 'https://example.com/cover.jpg',
        tags: ['prueba'],
        pageCount: 10
      }
    ];

    const spy = vi.spyOn(service, 'getLibrary').mockResolvedValue(mockResources);

    render(
      <MemoryRouter>
        <LibraryView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Historia de prueba')).toBeInTheDocument();
    });

    expect(screen.getByText('Tester')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
