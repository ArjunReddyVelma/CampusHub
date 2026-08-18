import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    const defaultTitle = 'CampusHub';
    document.title = title ? `CampusHub | ${title}` : defaultTitle;

    // We do NOT use a clean-up unmount effect that resets document.title directly,
    // to prevent overwriting the title of the newly mounted route during transitions.
  }, [title]);
};

export default useDocumentTitle;
