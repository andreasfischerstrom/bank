document.addEventListener('DOMContentLoaded', async () => {

    updatePercentageChangeColor();

    var isOpen = false;
    var goalDiv = document.getElementById("goal");

    
    // Hämta aktiepris
    const stockPriceElements = document.querySelectorAll('.stock-price');
    
    stockPriceElements.forEach(async (element) => {
        const symbol = element.getAttribute('data-symbol');
        
        try {
            const response = await fetch(`/stock-price?symbol=${symbol}`);
            const data = await response.json();
            
            if (data && data.price) {
                element.textContent = `$${data.price}`;
                
                const cardElement = element.closest('.card');
                
                if (cardElement) {
                    const quantityElement = cardElement.querySelector('.quantity');
                    
                    if (quantityElement) {
                        const quantityText = quantityElement.textContent;
                        
                        if (quantityText) {
                            const quantity = parseFloat(quantityText.split(' ')[0]);
                            
                            const currentWorthElement = cardElement.querySelector('.current-worth');
                            
                            if (currentWorthElement) {
                                const currentWorth = parseFloat(data.price) * quantity;
                                currentWorthElement.textContent = `${currentWorth.toFixed(2)}`;
                            } else {
                                console.error('current-worth element is null or undefined');
                            }
                        } else {
                            console.error('Quantity text content is null or undefined');
                        }
                    } else {
                        console.error('Quantity element is null or undefined');
                    }
                } else {
                    console.error('Card element is null or undefined');
                }
            } else {
                element.textContent = 'Price not available';
            }
        } catch (error) {
            console.error('Error fetching stock price:', error);
            element.textContent = 'Error fetching price';
        }
    });

    // Autocomplete
    const stockSearchInput = document.getElementById('stockSearch');

    stockSearchInput.addEventListener('input', async (event) => {
        const query = event.target.value;

        if (query.length > 0) {
            try {
                const response = await fetch(`/autocomplete?query=${query}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    const suggestions = data.map(stock => `${stock.name} (${stock.symbol})`);
                    displayAutocompleteSuggestions(suggestions);
                } else {
                    clearAutocompleteSuggestions();
                }
            } catch (error) {
                console.error('Error fetching autocomplete suggestions:', error);
                clearAutocompleteSuggestions();
            }
        } else {
            clearAutocompleteSuggestions();
        }
    });

function displayAutocompleteSuggestions(suggestions) {
    const autocompleteList = document.getElementById('autocompleteList');
    autocompleteList.innerHTML = '';

    suggestions.forEach(suggestion => {
        const listItem = document.createElement('li');
        listItem.textContent = suggestion;
        listItem.addEventListener('click', () => {
            const match = suggestion.match(/\(([^)]+)\)$/); 
            const selectedSymbol = match ? match[1] : ''; 
            stockSearchInput.value = selectedSymbol.trim();
            clearAutocompleteSuggestions(); 
        });
        autocompleteList.appendChild(listItem);
    });

    autocompleteList.style.display = 'block';
}


    function clearAutocompleteSuggestions() {
        const autocompleteList = document.getElementById('autocompleteList');
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
    }

    document.addEventListener("click", function(e) {
        if (e.target !== stockSearchInput) {
            clearAutocompleteSuggestions();
        }
    });

    stockSearchInput.addEventListener("input", function(e) {
        if (e.target.value === "") {
            clearAutocompleteSuggestions();
        }
    });


function updatePercentageChangeColor() {
    const percentageChangeElements = document.querySelectorAll('.percentage-change');

    percentageChangeElements.forEach(element => {
        const percentageChange = parseFloat(element.textContent);

        if (percentageChange > 0) {
            element.classList.add('positive-change');
            element.classList.remove('negative-change');
        } else if (percentageChange < 0) {
            element.classList.add('negative-change');
            element.classList.remove('positive-change');
        } else {
            element.classList.remove('positive-change', 'negative-change');
        }
    });
}



  // Progress bar
    function updateProgressBar() {
        const progressElement = document.getElementById('progress');
        const progressTextElement = document.getElementById('progressText');
        
        // Calculate total current stock value
        const totalInvestment = calculateTotalInvestment();
        
        const goal = 10000; 
        
        // Calculate progress percentage
        const progressPercentage = (totalInvestment / goal) * 100;

        // Update progress bar width and text
        progressElement.style.width = `${progressPercentage}%`;
        progressTextElement.textContent = `${progressPercentage.toFixed(2)}%`;
    }

// Totalt värde på aktier
function calculateTotalInvestment() {
    let total = 0;

    const stockValueElements = document.querySelectorAll('.current-value');
    
    stockValueElements.forEach(element => {
        const amountText = element.textContent.replace('$', '');
        const amount = parseFloat(amountText);
        
        if (!isNaN(amount)) {
            total += amount;
        }
    });

    return total;
}

    function toggleGoal(){
if(isOpen == false){
        isOpen = true;
        goalDiv.className += " goalActive";
        updateProgressBar();

    }
 else{
    goalDiv.className -= "goalActive";
    isOpen = false;
    updateProgressBar();
}
}

document.getElementById("showGoal").onclick = function() {toggleGoal()};




});




