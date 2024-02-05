import * as SQLite from 'expo-sqlite';
import { SECTION_LIST_MOCK_DATA } from './utils';

const db = SQLite.openDatabase('little_lemon');

/**
 * Create a table to store the menu items
 * @returns {Promise<unknown>}
 */
export async function createTable() {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'create table if not exists menuitems (id integer primary key not null, uuid text, title text, price text, category text);'
        );
      },
      reject,
      resolve
    );
  });
}

/**
 * Get menu items from the database
 * @returns {Promise<unknown>}
 */
export async function getMenuItems() {
  return new Promise((resolve) => {
    db.transaction((tx) => {
      tx.executeSql('select * from menuitems', [], (_, { rows }) => {
        resolve(rows._array);
      });
    });
  });
}

/**
 * Save menu items to the database
 * @param menuItems
 */
export function saveMenuItems(menuItems) {
  console.log('save menuItems', menuItems);
  db.transaction((tx) => {
    // Generate placeholders for each row - each row needs a separate (?,?,?,?)

    const placeholders = menuItems.map(() => '(?,?,?,?)').join(',');
    // Flatten the menuItems array to match the placeholders in the SQL query
    // const values = menuItems.flat();
    const values = menuItems.reduce((acc, item) => {
      acc.push(item.id, item.title, item.price, item.category);
      return acc;
    }, []);
    console.log('values', values.flat());
    // Insert the menu items into the database
    tx.executeSql(`insert into menuitems (uuid, title, price, category) values ${placeholders}`, values.flat());
  });
}

/**
 * Get data from db and filter by query and active categories
 * @param query
 * @param activeCategories
 * @returns {Promise<unknown>}
 */
export async function filterByQueryAndCategories(query, activeCategories) {
  return new Promise((resolve) => {
    // Prepare the placeholders for the IN clause based on the number of activeCategories
    const placeholders = activeCategories.map(() => '?').join(',');
    console.log(`select * from menuitems where title like ? and category in (${placeholders})`);
    // Prepare the parameters for the SQL query: first the query for the like part and second the activeCategories
    const params = [`%${query}%`, ...activeCategories];
    db.transaction((tx) => {
      tx.executeSql(
        `select * from menuitems where title like ? and category in (${placeholders})`, params,
        (_, { rows }) => {
          resolve(rows._array);
        }
      );
    })
  });
}
