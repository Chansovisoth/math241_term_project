document.getElementById('initialForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const numCompanies = parseInt(document.getElementById('numCompanies').value) + 1; // Adding 1 for "No Company"
    generateTransitionMatrixInputs(numCompanies);
    generateInitialStateInputs(numCompanies);
    document.getElementById('initialForm').style.display = 'none';
    document.getElementById('predictionForm').style.display = 'flex';
});

function generateTransitionMatrixInputs(numCompanies) {
    const transitionMatrixDiv = document.getElementById('transitionMatrix');
    transitionMatrixDiv.innerHTML = '<h2 class="mt-0">Enter transition probabilities:</h2>';

    for (let i = 0; i < numCompanies; i++) {
        const heading = document.createElement('h3');
        const companyName = i === numCompanies - 1 ? 'No Company' : `Company ${i}`;
        const icon = i === numCompanies - 1 ? 'domain_disabled' : 'source_environment';

        heading.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="material-symbols-outlined d-flex align-items-center" style="position: absolute;">${icon}</span>
                <span style="margin-left: 30px;">${companyName}</span>
            </div>
        `;

        transitionMatrixDiv.appendChild(heading);

        const group = document.createElement('div');
        group.className = 'transition-group';

        for (let j = 0; j < numCompanies; j++) {
            const label = document.createElement('label');
            label.textContent = i === j ? `P(Stay):` : `P(${companyName} to ${j === numCompanies - 1 ? 'No Company' : `Company ${j}`}):`;

            const input = document.createElement('input');
            input.type = 'number';
            input.id = `trans${i}_${j}`;
            input.step = '0.01';
            input.required = true;

            group.appendChild(label);
            group.appendChild(input);
        }

        transitionMatrixDiv.appendChild(group);
    }
    const hr = document.createElement('hr');
    transitionMatrixDiv.appendChild(hr); // hr element after input field
}

function generateInitialStateInputs(numCompanies) {
    const initialStateDiv = document.getElementById('initialState');
    initialStateDiv.innerHTML = '<h2>Enter initial number of subscribers:</h2>';
    const group = document.createElement('div');
    group.className = 'initial-group';
    for (let i = 0; i < numCompanies - 1; i++) {
        const label = document.createElement('label');
        label.textContent = `Company ${i}:`;
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `init${i}`;
        input.required = true;
        group.appendChild(label);
        group.appendChild(input);
    }
    const totalLabel = document.createElement('label');
    totalLabel.textContent = 'Total Households:';
    const totalInput = document.createElement('input');
    totalInput.type = 'number';
    totalInput.id = 'totalHouseholds';
    totalInput.required = true;
    group.appendChild(totalLabel);
    group.appendChild(totalInput);
    initialStateDiv.appendChild(group);
}

document.getElementById('predictionForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const numCompanies = parseInt(document.getElementById('numCompanies').value) + 1;
    const years = parseInt(document.getElementById('years').value);
    const transitionMatrix = [];
    const initialState = [];

    for (let i = 0; i < numCompanies; i++) {
        const row = [];
        for (let j = 0; j < numCompanies; j++) {
            row.push(parseFloat(document.getElementById(`trans${i}_${j}`).value));
        }
        transitionMatrix.push(row);
    }

    for (let i = 0; i < numCompanies - 1; i++) {
        initialState.push(parseFloat(document.getElementById(`init${i}`).value));
    }

    const totalHouseholds = parseFloat(document.getElementById('totalHouseholds').value);
    initialState.push(totalHouseholds - initialState.reduce((a, b) => a + b, 0));

    let futureState = initialState;
    const stateOverTime = [initialState.slice()];

    for (let i = 0; i < years; i++) {
        futureState = multiplyMatrixVector(transitionMatrix, futureState);
        stateOverTime.push(futureState.slice());
    }

    displayResult(transitionMatrix, initialState, futureState, numCompanies);
    drawChart(stateOverTime, numCompanies, years);
});

function multiplyMatrixVector(matrix, vector) {
    const result = Array(vector.length).fill(0);
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            result[i] += matrix[i][j] * vector[j];
        }
    }
    return result;
}

function displayResult(matrix, initialState, futureState, numCompanies) {
    const matrixDisplay = document.getElementById('matrixDisplay');
    const initialStateDisplay = document.getElementById('initialStateDisplay');
    const futureStateDisplay = document.getElementById('futureStateDisplay');

    const companiesHeaders = Array.from({ length: numCompanies }, (_, i) => `<th>${i === numCompanies - 1 ? 'No Company' : 'Company ' + i}</th>`).join('');

    matrixDisplay.innerHTML = '<div class="table-container" style="overflow-x: scroll;"><table><tr>' + companiesHeaders + '</tr>' +
        matrix.map(row => '<tr>' + row.map(val => `<td>${val.toFixed(4)}</td>`).join('') + '</tr>').join('') + '</table></div>';

    initialStateDisplay.innerHTML = '<div class="table-container" style="overflow-x: scroll;"><table><tr>' + companiesHeaders + '</tr>' +
        '<tr>' + initialState.map(val => `<td>${val.toFixed(4)}</td>`).join('') + '</tr></table></div>';

    futureStateDisplay.innerHTML = '<div class="table-container" style="overflow-x: scroll;"><table><tr>' + companiesHeaders + '</tr>' +
        '<tr>' + futureState.map(val => `<td>${val.toFixed(4)}</td>`).join('') + '</tr></table></div>';

    document.getElementById('result').style.display = 'block';
}

let predictionChart;

function drawChart(stateOverTime, numCompanies, years) {
    const ctx = document.getElementById('predictionChart').getContext('2d');
    const labels = Array.from({ length: years + 1 }, (_, i) => `Year ${i}`);
    const datasets = stateOverTime[0].map((_, companyIdx) => ({
        label: companyIdx === numCompanies - 1 ? 'No Company' : `Company ${companyIdx}`,
        data: stateOverTime.map(state => state[companyIdx]),
        fill: false,
        borderColor: getRandomColor(),
        tension: 0.1
    }));

    if (predictionChart) {
        predictionChart.destroy();
    }

    predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Subscribers'
                    }
                }
            }
        }
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateRandomValues(numCompanies) {
    // Generate random transition probabilities
    for (let i = 0; i < numCompanies; i++) {
        let rowSum = 0;
        const row = [];

        // Generate random values for each column
        for (let j = 0; j < numCompanies; j++) {
            const value = Math.random();
            row.push(value);
            rowSum += value;
        }

        // Normalize the row so that the sum is 1
        for (let j = 0; j < numCompanies; j++) {
            const normalizedValue = row[j] / rowSum;
            const element = document.getElementById(`trans${i}_${j}`);
            if (element) {
                element.value = normalizedValue.toFixed(2);
            } else {
                console.error(`Element with id trans${i}_${j} not found.`);
            }
        }
    }

    // Generate random initial subscribers
    const initialState = [];
    let initialStateSum = 0;

    for (let i = 0; i < numCompanies - 1; i++) { // We generate values only for the companies, not "No Company"
        const value = Math.floor(Math.random() * 1000) + 1; // Ensure more than 0
        initialState.push(value);
        initialStateSum += value;
    }

    // Set the initial subscribers values
    for (let i = 0; i < numCompanies - 1; i++) {
        const element = document.getElementById(`init${i}`);
        if (element) {
            element.value = initialState[i];
        } else {
            console.error(`Element with id init${i} not found.`);
        }
    }

    // Set the total households
    document.getElementById('totalHouseholds').value = initialStateSum;
}

document.getElementById('randomButton').addEventListener('click', function () {
    const numCompanies = parseInt(document.getElementById('numCompanies').value) + 1;
    generateRandomValues(numCompanies);
});
