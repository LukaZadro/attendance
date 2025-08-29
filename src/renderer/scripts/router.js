const routes = {
    "#home": {
        html: '../views/home.html',
        css: "./styles/home-style.css",
        js: './scripts/home.js'
    },
    "#add-event": {
        html: '../views/add-event.html',
        css: "./styles/add-event-style.css",
        js: './scripts/add-event.js'
    },
    "#add-member": {
        html: '../views/add-member.html',
        css: "./styles/add-member-style.css",
        js: './scripts/add-member.js'
    },
    "#past-events": {
        html: '../views/past-events.html',
        css: "./styles/past-events-style.css",
        js: './scripts/past-events.js'
    },
    "#see-members": {
        html: '../views/see-members.html',
        css: "./styles/see-members-style.css",
        js: './scripts/see-members.js'
    }  
}

async function loadView(route) {
    // Remove previous view scripts BEFORE anything else
    document.querySelectorAll('script[data-view-script]').forEach(script => {
        script.remove();
    });
    //remove previous css
    document.querySelectorAll('link[data-view-css]').forEach(link => {
        link.remove();
    });

    //highlight selected category
    const buttons = document.querySelectorAll("button")
    buttons.forEach(button => button.classList.remove("active"))
    const selectedButton = document.getElementById(route)
    selectedButton.classList.add("active")

    const { html, css, js } = routes[route] || routes["#home"];
    const content = await window.electronAPI.loadView(html);
    document.querySelector('.container').innerHTML = content;

    if (css) {
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = css;
        link.setAttribute('data-view-css', 'true')
        document.head.appendChild(link);
    }

    if (js) {
        let script = document.createElement("script")
        script.src = js
        script.setAttribute('data-view-script', 'true')
        document.body.appendChild(script)
    }
}

window.addEventListener('hashchange', () => {
    const route = window.location.hash || "#home";
    loadView(route);
});

window.addEventListener('DOMContentLoaded', () => {
    const route = window.location.hash || "#home";
    loadView(route);
});