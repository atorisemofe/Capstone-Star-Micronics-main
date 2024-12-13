import db from '../../../lib/db.js';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const tableNumber = searchParams.get('table');

  if ((type === 'getTableInfo') && !tableNumber) {
    return new Response(JSON.stringify({ error: 'Table number is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  console.log('Received request:', req.url);
  console.log('Query parameter "type":', type);
  console.log('Query parameter "table":', tableNumber);

  let query;
  switch (type) {
    case 'getDevices':
      query = 'SELECT TableID, DeviceID, Help FROM table_info';
      break;
    case 'menuDestinations':
      query = 'SELECT DISTINCT destination FROM Menu';
      break;
    case 'getOrders':
      query = `
        SELECT 
          Order_info.OrderID AS id, 
          Order_info.TableID AS tableNumber, 
          Menu.ItemID AS itemId,
          Menu.name AS itemName, 
          Menu.Price AS price,
          Order_info.Destination AS area, 
          Order_info.Status 
        FROM Order_info 
        JOIN Menu ON Order_info.ItemID = Menu.ItemID
        ${tableNumber ? 'WHERE Order_info.TableID = ?' : ''}
      `;
      break;
    case 'getTableInfo':
      query = 'SELECT Balance FROM table_info WHERE TableID = ?';
      break;
    case 'getMenu':
      query = 'SELECT ItemID, name, description, Destination, Price, image FROM Menu';
      break;
    // Add more cases as needed
    default:
      console.error('Invalid type parameter:', type);
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
  }

  console.log('Executing query:', query);

  try {
    const [rows] = await db.query(query, tableNumber ? [tableNumber] : []);
    console.log('Query result:', rows);

    if (type === 'getOrders') {
      const orders = rows.map(row => ({
        id: row.id,
        orderNumber: row.id,
        tableNumber: row.tableNumber,
        itemId: row.itemId,
        itemName: row.itemName,
        price: row.price,
        status: translateStatus(row.Status),
        area: row.area,
      }));
      return new Response(JSON.stringify(orders), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (type === 'getTableInfo') {
      return new Response(JSON.stringify(rows[0]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

const translateStatus = (status) => {
  switch (status) {
    case 0:
      return 'New';
    case 1:
      return 'Preparing';
    case 2:
      return 'ReadyToDeliver';
    case 3:
      return 'Delivered';
    default:
      return 'Unknown';
  }
};

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const tableNumber = searchParams.get('table');

  if ((type === 'updateTableInfo') && !tableNumber) {
    return new Response(JSON.stringify({ error: 'Table number is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  console.log('Received request:', req.url);
  console.log('Query parameter "type":', type);
  console.log('Query parameter "table":', tableNumber);

  let query;
  let values;
  switch (type) {
    case 'addDevice':
      const { tableId, deviceId } = await req.json();
      query = 'INSERT INTO table_info (TableID, DeviceID, Total, Balance, Help) VALUES (?, ?, 0.00, 0.00, 0)';
      values = [tableId, deviceId];
      break;
    case 'deleteDevice':
      const { deviceId: deleteDeviceId } = await req.json();
      query = 'DELETE FROM table_info WHERE DeviceID = ?';
      values = [deleteDeviceId];
      break;
    case 'updateDevice':
      const { deviceId: updateDeviceId, newTableId } = await req.json();
      query = 'UPDATE table_info SET TableID = ? WHERE DeviceID = ?';
      values = [newTableId, updateDeviceId];
      break;
    case 'updateOrderStatus':
      const { orderId, newStatus } = await req.json();
      query = 'UPDATE Order_info SET Status = ? WHERE OrderID = ?';
      values = [newStatus === 'Delivered' ? 3 : newStatus, orderId];
      break;
    case 'deleteOrders':
      const { tableId: deleteTableId } = await req.json();
      query = 'DELETE FROM Order_info WHERE TableID = ?';
      values = [deleteTableId];
      break;
    case 'updateTableInfo':
      const { tableId: updateTableId, total, balance, help } = await req.json();
      const formattedBalance = parseFloat(balance).toFixed(2); // Ensure balance is formatted as decimal(18,2)
      query = 'UPDATE table_info SET Total = 0, Balance = 0, Help = ? WHERE TableID = ?';
      values = [total, formattedBalance, help, updateTableId];
      break;
    case 'updateTableBalance':
      const { tableId: balanceTableId, newBalance } = await req.json();
      query = 'UPDATE table_info SET Balance = ? WHERE TableID = ?';
      values = [newBalance, balanceTableId];
      break;
    case 'addOrders':
      const { tableId: orderTableID, items } = await req.json();
      query = `
      INSERT INTO Order_info (TableID, ItemID, Destination, Status)
      VALUES ${items.map(() => '(?, ?, ?, 0)').join(', ')}
    `;
      values = items.flatMap(item => [orderTableID, item.itemId, item.destination]);
      break;
    default:
      console.error('Invalid type parameter:', type);
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
  }

  console.log('Executing query:', query);

  try {
    const [result] = await db.query(query, values);
    console.log('Query result:', result);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Error executing query:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}