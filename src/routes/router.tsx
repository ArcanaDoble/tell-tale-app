import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../views/AppLayout';
import LibraryView from '../views/LibraryView';
import DetailsView from '../views/DetailsView';
import ReaderView from '../views/ReaderView';
import UploadView from '../views/UploadView';
import EditResourceView from '../views/EditResourceView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LibraryView />
      },
      {
        path: 'details/:resourceId',
        element: <DetailsView />
      },
      {
        path: 'edit/:resourceId',
        element: <EditResourceView />
      },
      {
        path: 'read/:resourceId',
        element: <ReaderView />
      },
      {
        path: 'upload',
        element: <UploadView />
      }
    ]
  }
]);

export default router;
