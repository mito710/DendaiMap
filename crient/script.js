async function searchRoute() {

    const start = document.getElementById("start").value;
    const goal = document.getElementById("goal").value;

    const response = await fetch("http://127.0.0.1:8000/route", {

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