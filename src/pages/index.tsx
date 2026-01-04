import {useEffect} from 'react';
import {useLocation} from '@docusaurus/router';

export default function Home(): null {
  const location = useLocation();

  useEffect(() => {
    // Redirect to the static landing page
    window.location.replace('/home.html');
  }, []);

  return null;
}
