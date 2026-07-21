const { getDbConnection } = require('./database');

async function wipeAccounts() {
  try {
    const db = await getDbConnection();
    await db.exec('DELETE FROM Users');
    console.log('All buyer and seller accounts have been successfully deleted from the database.');
  } catch (err) {
    console.error('Error wiping accounts:', err);
  }
}

wipeAccounts();
