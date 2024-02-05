import { useRef, useEffect } from 'react';


/**
 * Get section list data from the data passed in
 * @param data
 * @returns {{data: *, title: *}[]}
 */
export function getSectionListData(data) {
  // create a new object to store the section list data
  const sectionListData = data.reduce((acc, item) => {
    const { id, title, price, category } = item;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ id, title, price });
    return acc;
  }, {});
  // convert the object into an array of objects and return it
  return Object.entries(sectionListData).map(([title, data]) => ({ title, data }));
}

/**
 * Hook to run an effect only on the first render
 * @param effect
 * @param dependencies
 */
export function useUpdateEffect(effect, dependencies = []) {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      return effect();
    }
  }, dependencies);
}
