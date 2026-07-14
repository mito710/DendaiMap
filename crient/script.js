console.log("script.js loaded");
async function searchRoute() {
    console.log("searchRoute called");

    const start = document.getElementById("start").value;
    const goal = document.getElementById("goal").value;

    const response = await fetch("https://dendaimap.onrender.com/route", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            start: start,
            goal: goal
        })

    });

    const result = await response.json();

    document.getElementById("result").textContent =
        JSON.stringify(result, null, 2);

}