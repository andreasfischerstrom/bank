const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
const port = 3000;
let currentUser = null;

// Anslut till databasen
const db = new sqlite3.Database('./database.db');
const FMP_API_KEY = 'iziOlWssLm01FPW7rBLlmSDX8h87Oy3I';


const mockStockData = {
    'AMZN': {
        symbol: 'AMZN',
        price: 15.25
    },
    'GOOG': {
        symbol: 'GOOG',
        price: 11.50
    },
    'RIVN': {
        symbol: 'RIVN',
        price: 21.50
    },
    // Add more mock data as needed
};



// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('login');
});





// Registrering
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
        if (err) {
            return res.status(500).send(err.message);
        }
      res.render('login', { message: 'Registration successful!' }); // Set message variable
    });
});


//Registrering routing
app.get('/register', (req, res) => {
    res.render('register');
});


// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (!user) {
            return res.redirect('/');
        }
        currentUser = user.id;
        const usernameValue = user.username;

        // Fetch investments data for the logged-in user
        db.all('SELECT * FROM investments WHERE userId = ?', [currentUser], (err, investments) => {
            if (err) {
                return res.status(500).send(err.message);
            }
            // Redirect to dashboard with username and investments data
        res.redirect(`/dashboard?currentUser=${currentUser}&usernameValue=${usernameValue}`);
        });
    });
});


// Dashboard
app.get('/dashboard', (req, res) => {
    db.all(`
        SELECT 
            symbol, 
            SUM(quantity) as totalQuantity,
            AVG(price) as avgPrice
        FROM investments
        GROUP BY symbol
    `, async (err, groupedInvestments) => {
        if (err) {
            return res.status(500).send(err.message);
        }

        const stockPrices = {};

        // API-data för aktier
       /* for (const investment of groupedInvestments) {
            try {
                const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${investment.symbol}?apikey=${FMP_API_KEY}`);
                const stockData = response.data[0];
                
                if (stockData) {
                    stockPrices[investment.symbol] = stockData.price;
                }
            } catch (error) {
                console.error('Error fetching stock price:', error);
            }
        }*/


        //Mockdata
        for (const investment of groupedInvestments) {
            const mockData = mockStockData[investment.symbol];
            
            if (mockData) {
                stockPrices[investment.symbol] = mockData.price;
            }
        }



        // Procentuell förändring för portföljen
        const investments = groupedInvestments.map(investment => {
            const currentValue = (stockPrices[investment.symbol] || 0) * investment.totalQuantity;
            const originalValue = investment.avgPrice * investment.totalQuantity;
            const percentageChange = ((currentValue - originalValue) / originalValue) * 100;

            return {
                symbol: investment.symbol,
                quantity: investment.totalQuantity,
                originalValue: originalValue,
                currentValue: currentValue,
                percentageChange: percentageChange
            };
        });



        // Hämta individuella investeringar
        db.all(`
            SELECT 
                symbol, 
                quantity,
                price
            FROM investments
        `, async (err, individualInvestments) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            // Calculate current value and percentage change for individual investments
            const individualInvestmentData = individualInvestments.map(investment => {
                const currentValue = (stockPrices[investment.symbol] || 0) * investment.quantity;
                const originalValue = investment.price * investment.quantity;
                const percentageChange = ((currentValue - originalValue) / originalValue) * 100;

                return {
                    symbol: investment.symbol,
                    quantity: investment.quantity,
                    originalValue: originalValue,
                    currentValue: currentValue,
                    percentageChange: percentageChange
                };
            });

            res.render('dashboard', { investments, individualInvestments: individualInvestmentData,username:req.query.usernameValue });
        });
    });
});





// Aktiesök
app.get('/search', async (req, res) => {
    const { query } = req.query;
    
    try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/search?query=${query}&apikey=${FMP_API_KEY}`);
        const data = response.data;
        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Lägg till aktie
app.post('/invest', (req, res) => {
    const { symbol, quantity, price } = req.body;
    
    if (!currentUser) {
        return res.redirect('/');
    }

    db.run('INSERT INTO investments (userId, symbol, quantity, price) VALUES (?, ?, ?, ?)', [currentUser, symbol, quantity, price], (err) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.redirect('/dashboard');
    });
});



// Hämta aktiepris
app.get('/stock-price', async (req, res) => {
    const { symbol } = req.query;
    
    /*try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`);
        const stockData = response.data[0];
        
        if (!stockData) {
            return res.status(404).send('Stock not found');
        }

        res.json({ symbol: stockData.symbol, price: stockData.price });
    } catch (error) {
        res.status(500).send(error.message);
    } */


    //mock data
    const mockData = mockStockData[symbol];

if (mockData) {
    res.json({ symbol: mockData.symbol, price: mockData.price });
} else {
    res.status(404).send('Stock not found');
}


});


// Autocomplete
app.get('/autocomplete', async (req, res) => {
    const { query } = req.query;
    const apiKey = 'iziOlWssLm01FPW7rBLlmSDX8h87Oy3I'; 

    try {
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&apikey=${apiKey}`);
        const data = response.data;

        if (data && data.length > 0) {
            const symbols = data.map(stock => ({
                symbol: stock.symbol,
                name: stock.name
            }));
            res.json(symbols);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).send('Error fetching stock symbols');
    }
});



// Logout
app.get('/logout', (req, res) => {
    currentUser = null;
    res.redirect('/');
});





app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
