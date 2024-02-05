import {useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, SafeAreaView, SectionList, StatusBar, StyleSheet, Text, View,} from 'react-native';
import {Searchbar} from 'react-native-paper';
import debounce from 'lodash.debounce';
import {createTable, filterByQueryAndCategories, getMenuItems, saveMenuItems,} from './database';
import Filters from './components/Filters';
import {getSectionListData, useUpdateEffect} from './utils';
import {log} from 'expo/build/devtools/logger';

const API_URL =
  'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/menu-items-by-category.json';
const sections = ['Appetizers', 'Salads', 'Beverages'];

/**
 * Item component
 * @param title
 * @param price
 * @returns {JSX.Element}
 * @constructor
 */
const Item = ({ title, price }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.title}>${price}</Text>
  </View>
);

/**
 * Main app component
 * @returns {JSX.Element}
 * @constructor
 */
export default function App() {
  const [data, setData] = useState([]);
  const [searchBarText, setSearchBarText] = useState('');
  const [query, setQuery] = useState('');
  const [filterSelections, setFilterSelections] = useState(
    sections.map(() => false)
  );

  /**
   * Fetch data from API
   * @returns {Promise<any|*[]>}
   */
  const fetchData = async() => {
    console.log('fetchData');
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      // double check if the data is in the expected format menu: object and its value is an array
      if (!data.menu || !Array.isArray(data.menu)) {
        console.error("Menu data is not available or not in the expected format");
        return [{
          id: 'error',
          title: 'Data not in expected format',
          price: 0,
          category: 'Error',
        }];
      }
      const updatedData = data.menu.map((item) => ({
        ...item,
        // api returns 'category' as an object with a title property -> we need to flatten it into a string
        category: item.category.title,
      }));
      return updatedData;
    } catch(e) {
      // send error to the console
      console.log(e);
      return [{
        id: 'error',
        title: 'Error fetching data',
        price: 0,
        category: 'Error',
      }];
    }
  }

  /**
   * Hook when the component mounts -> load items from db or api
   */
  useEffect(() => {
    (async () => {
      try {
        await createTable();
        let tempMenuItems = await getMenuItems();
        // The application only fetches the menu data once from a remote URL
        // and then stores it into a SQLite database.
        // After that, every application restart loads the menu from the database
        if (!tempMenuItems.length) {
          tempMenuItems = await fetchData();
          console.log('menuitems', tempMenuItems);
          if(tempMenuItems[0].id !== 'error') {
            saveMenuItems(tempMenuItems);
          } else {
            Alert.alert('Error fetching data. Please try again later.');
          }
        }
        const sectionListData = getSectionListData(tempMenuItems);
        console.log('sectionListData', sectionListData);
        setData(sectionListData);
      } catch (e) {
        // Handle error
        Alert.alert(e.message);
      }
    })();
  }, []);

  useUpdateEffect(() => {
    (async () => {
      const activeCategories = sections.filter((s, i) => {
        // If all filters are deselected, all categories are active
        if (filterSelections.every((item) => item === false)) {
          return true;
        }
        return filterSelections[i];
      });
      try {
        const menuItems = await filterByQueryAndCategories(
          query,
          activeCategories
        );
        console.log('menuItems', menuItems);
        const sectionListData = getSectionListData(menuItems);
        setData(sectionListData);
      } catch (e) {
        Alert.alert(e.message);
      }
    })();
  }, [filterSelections, query]);

  const lookup = useCallback((q) => {
    setQuery(q);
  }, []);

  const debouncedLookup = useMemo(() => debounce(lookup, 500), [lookup]);

  const handleSearchChange = (text) => {
    setSearchBarText(text);
    debouncedLookup(text);
  };

  const handleFiltersChange = async (index) => {
    const arrayCopy = [...filterSelections];
    arrayCopy[index] = !filterSelections[index];
    setFilterSelections(arrayCopy);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Searchbar
        placeholder="Search"
        placeholderTextColor="white"
        onChangeText={handleSearchChange}
        value={searchBarText}
        style={styles.searchBar}
        iconColor="white"
        inputStyle={{ color: 'white' }}
        elevation={0}
      />
      <Filters
        selections={filterSelections}
        onChange={handleFiltersChange}
        sections={sections}
      />
      <SectionList
        style={styles.sectionList}
        sections={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Item title={item.title} price={item.price} key={item.id} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
      />
    </SafeAreaView>
  );
}

/**
 * Styles for the App component
 * @type {{container: {backgroundColor: string, flex: number, paddingTop: number}, item: {padding: number, alignItems: string, flexDirection: string, justifyContent: string}, searchBar: {backgroundColor: string, shadowRadius: number, marginBottom: number, shadowOpacity: number}, header: {paddingVertical: number, backgroundColor: string, color: string, fontSize: number}, sectionList: {paddingHorizontal: number}, title: {color: string, fontSize: number}}}
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: '#495E57',
  },
  sectionList: {
    paddingHorizontal: 16,
  },
  searchBar: {
    marginBottom: 24,
    backgroundColor: '#495E57',
    shadowRadius: 0,
    shadowOpacity: 0,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    fontSize: 24,
    paddingVertical: 8,
    color: '#FBDABB',
    backgroundColor: '#495E57',
  },
  title: {
    fontSize: 20,
    color: 'white',
  },
});
