// import Chart from 'chart.js';

Chart.defaults.color = "white";

/** @type {HTMLElement} */
const transparenzChartElem = document.getElementById("transparenz-diagram");
/** @type {HTMLElement} */
const gewinnChartElem = document.getElementById("gewinnverteilung-diagram");

/** @type {import('chart.js').ChartData} */
const dataTransparenz = {
    labels: [
        "Verkauf Ihrer Daten",
        "Steuerhinterzieung",
        "Verkauf"
    ],
    datasets: [{
        label: "Unternehmenseinkommen",
        data: [60, 25, 5],
        backgroundColor: [
            'rgb(0, 0, 255)',
            'rgb(0, 255, 0)',
            'rgb(255, 255, 0)'
        ],
    }],
};

/**
 * #BUG
 */

/** @type { import('chart.js').ChartData } */
const dataGewinn = {
    labels: ["Gewinnverteilung"],
    datasets: [{
        label: "Gehälter der Eigentümer",
        data: .6,
        backgroundColor: 'rgb(255, 0, 255)',
    },
    {
        label: "Gehälter der Mitarbeiter",
        data: .25,
        backgroundColor: 'rgb(0, 255, 0)',
    },
    {
        label: "Produktentwicklung",
        data: .5,
        backgroundColor: 'rgb(255, 255, 0)',
    },
],
};


/** @type {Chart.Chart} */
let transparenzChart;
/** @type {Chart.Chart} */
let gewinnChart;


function createTransparenzChart() {
    transparenzChart = new Chart.Chart(transparenzChartElem, {
        type: "pie",
        data: dataTransparenz,
        options: {
            responsive: true,
        }
    })
}

function createGewinnChart() {
    gewinnChart = new Chart.Chart(gewinnChartElem, {
        type: "bar",
        data: dataGewinn,
        options: {
            responsive: true,
            scales: {
                y: true
            }
        }
    
    })
}

/** @param {number | undefined} iteration  */
function waitToCreateCharts(iteration) {
    if (!iteration) { iteration = 0 };
    if (iteration >= 10) { throw new Error("Too many iterations!"); };
    setTimeout(() => {
        if (document.querySelector("main")?.hidden) {
            waitToCreateCharts(iteration + 1);
        } else {
            createGewinnChart();
            createTransparenzChart();
        }
    }, 20);
};

document.addEventListener('DOMContentLoaded', () => { waitToCreateCharts(); });