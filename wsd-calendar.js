const carousel = document.getElementById("calendar-carousel");
const top3_sec = document.getElementById("top3-assns");
const collapse = document.getElementById("expanded-assns"); // Expanded assignments collapse section
const toggle_assns = document.getElementById("toggle-assns");
const now = new Date();
let file = "";
let assns = [];
let upcoming_assns = [];
let past_assns = [];
let top_assns = [];
let scroll_offset;

document.addEventListener("DOMContentLoaded", () => { initCal(); }); // Event is always the first parameter passed, must explictly pass parameters

file = document.getElementById("JSON").textContent; // In order to work, the filename must be a LEARN quicklink to assns.json


// ================================= PROCESSING JSON FILE =========================================== //
async function readJSON() {
    try {
        const response = await fetch(file); // HTTP resquest to assns.json, awaits response
        if (!response.ok) throw new Error(`HTTP error. Status ${response.status}`); // HTTP codes 200-299 = success, if !response.ok throw error with status code
        const assns = await response.json(); // parses data in JSON file
        return assns;
    } catch (error) {
        console.error("Failed to fetch assignments:", error);
        return []; // returns empty array as fallback
    }
}

async function processAssnLst() {
    assns = await readJSON(file);
    // Change due dates in array from text to Date objects
    assns.forEach((assn) => { 
        assn.due += "-05:00"; 
        const read = new Date(assn.due);
        if (isNaN(read.getTime())) console.error("Error: invalid date format in JSON" + assn.name);
        else assn.due = read;                
    });
    assns.sort((a, b) => a.due - b.due); // Sort assignments by ascending order of date
    // Split assns into the past and upcoming lists
    [past_assns, upcoming_assns] = assns.reduce(([past, upcoming], assn) => {
            if (assn.due < now) past.push(assn);
            else upcoming.push(assn);
            return [past, upcoming];
        }, [[], []]
    );
    // Get top 3 upcoming tasks
    top_assns = upcoming_assns.slice(0, Math.min(3, upcoming_assns.length));
}


// ================================== CALENDAR SECTION ============================================== //
// Equality operator for Date objects, excluding time
Date.prototype.sameDay = function (other) {
    if (this.getFullYear() != other.getFullYear()) return false;
    else if (this.getMonth() != other.getMonth()) return false;
    else return this.getDate() === other.getDate();
}

const clearCal = (cal_id) => {
    const tbody = document.querySelector("#" + cal_id + " tbody");
    tbody.innerHTML = "";
}

const loadMonth = (cal_id, date) => {
    clearCal(cal_id);
    const first_day_of_week = date.getDay();
    const month = date.getMonth();
    let d = new Date(date); // starting date to load into the calendar as the first day, will be incremented in loop
    d.setDate(d.getDate() - first_day_of_week);
    const cal = document.getElementById(cal_id);
    const tbody = cal.querySelector("#" + cal_id + " tbody");

    // Populate calendar
    for (let week = 0; week < 5; week++) {
        const row = document.createElement("tr");
        tbody.appendChild(row);
        for (let day = 0; day < 7; day++) {
            const cell = document.createElement("td");
            row.appendChild(cell);
            cell.textContent = d.getDate();
            // Colour dates not in the current month a faint grey
            if (d.getMonth() != month) cell.classList.add("faint");
            // Add shading for dates that have due date on them
            else {
                for (let assn of assns) {
                    if (d.sameDay(assn.due)) {
                        // Case 1: cell is already shaded -> add a new assignment to the popover
                        if (cell.classList.contains("shaded")) {
                            let popover_content = cell.getAttribute("data-bs-content");
                            popover_content += "<br>" + assn.name;
                            cell.setAttribute("data-bs-content", popover_content);
                        // Case 2: cell has not already been shaded
                        } else {
                            cell.classList.add("shaded");
                            cell.setAttribute("data-bs-toggle", "popover");
                            cell.setAttribute("data-bs-content", assn.name);
                            new bootstrap.Popover(cell, { 
                                trigger: "hover", 
                                html: true, 
                                placement: "top",
                                customClass: "text-center"
                            });
                        }
                    }
                }
            }
            // Increment day
            d.setDate(d.getDate() + 1);
        }
    }

    // Set data attributes
    cal.setAttribute("data-month", month);
    cal.setAttribute("data-year", date.getFullYear());
}

async function initCal() {
    // Process the JSON file and display upcoming assignments
    await displayAssns();

    // Initialize month title
    const month_title = new Intl.DateTimeFormat('en-US', {month: "long"}).format(now);
    document.getElementById("month-title").textContent = month_title;

    // Initialize calendars
    let date2 = new Date(now); // date2 is the current month, displayed on the active slide
    date2.setDate(1);
    let date1 = new Date(date2);
    date1.setMonth(date1.getMonth() - 1);
    let date3 = new Date(date2);
    date3.setMonth(date3.getMonth() + 1);
    loadMonth("calendar-1", date1);
    loadMonth("calendar-2", date2);
    loadMonth("calendar-3", date3);
}

// Slide transitions between months
carousel.addEventListener("slid.bs.carousel", (event) => {
    const slides = ["calendar-1", "calendar-2", "calendar-3"];
    const active_slide_idx = Array.from(carousel.querySelectorAll(".carousel-item")).findIndex((item) => item.classList.contains("active"));
    const active_slide = carousel.querySelector(".carousel-item.active");
    const active_cal = active_slide.querySelector("table");
    const date = new Date(parseInt(active_cal.getAttribute("data-year"), 10), parseInt(active_cal.getAttribute("data-month"), 10), 1); // "10" in parseInt() makes it a base 10 number
    let updated_date = new Date(date);

    // Load new title for the current slide
    const month_title = new Intl.DateTimeFormat('en-US', {month: 'long'}).format(date);
    document.getElementById("month-title").textContent = month_title;

    // User clicked "previous" -> slide 1 behind current is updated
    if (event.direction === "right") {
        updated_date.setMonth(updated_date.getMonth() - 1);
        let updated_cal_id = slides[(active_slide_idx - 1 + slides.length) % slides.length];
        loadMonth(updated_cal_id, updated_date);
    // User clicked "next" -> slide 1 ahead of current is updated
    } else {
        updated_date.setMonth(updated_date.getMonth() + 1);
        let updated_cal_id = slides[(active_slide_idx + 1) % slides.length];
        loadMonth(updated_cal_id, updated_date);
    }
});


// ================================== UPCOMING DUE DATES SECTION =========================================== //
const getAssnIcon = (type) => {
    switch(type) {
        case "quiz": return "bi-question-square-fill";
        case "discussion": return "bi-chat-left-text";
        case "code": return "bi-braces";
        // =========================================== //
        // ADD NEW ASSIGNMENT TYPES ABOVE THIS COMMENT //
        // =========================================== //
        default: return "bi-pencil-fill";
    } 
}

const displayTopAssns = () => {
    const rows = top3_sec.querySelectorAll(".d-none");
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let assn = top_assns[i];
        if (assn) {
            // Customize icon based on assignment type
            const icon = row.querySelector("i");
            const type = assn.type.toLowerCase();
            icon.classList.add(getAssnIcon(type));
            // Customize assignment details
            row.querySelector("strong").textContent = assn.name;
            const button = row.querySelector("button");
            button.textContent = new Intl.DateTimeFormat('en-US', {month: "short", day: "numeric"}).format(assn.due);
            button.setAttribute("href", assn.link);
            // Remove "display: none" tag from row
            row.classList.remove("d-none");
        } 
    }
}

// Adds an assignment row to the destination (the collapse)
const addRow = (assn) => {
    const row = top3_sec.querySelector(".row");
    const new_row = row.cloneNode(true); // true = deep copy including all children
    new_row.querySelector("strong").textContent = assn.name;
    const button = new_row.querySelector("button");
    button.textContent = new Intl.DateTimeFormat('en-US', {month: "short", day: "numeric"}).format(assn.due);
    button.setAttribute("href", assn.link);
    const img = new_row.querySelector("i");
    img.classList.remove(...img.classList); // Remove all classes
    img.classList.add("bi", "assn-icon") // Re-add base icon classes
    img.classList.add(getAssnIcon(assn.type));
    return new_row;
}

const addAssnLst = () => {
    const divider = collapse.querySelector("hr");
    for (let i = 0; i < past_assns.length; i++) {
        const new_row = addRow(past_assns[i]);
        new_row.classList.add("past-due");
        collapse.insertBefore(new_row, divider);
    }
    const placeholder_row = addRow(upcoming_assns[0]);
    placeholder_row.id = "scroll-center";
    collapse.appendChild(placeholder_row);
    for (let i = 1; i < upcoming_assns.length; i++) {
        const new_row = addRow(upcoming_assns[i]);
        collapse.appendChild(new_row);
    }
}

async function displayAssns() {
    await processAssnLst();
    displayTopAssns();
    addAssnLst();
}

// ================================== EXPANDING DUE DATES SECTION ========================================== //
collapse.addEventListener("show.bs.collapse", () => {
    top3_sec.style.height = "0";
    top3_sec.classList.remove("open");
    document.getElementById("assns-title-row").classList.remove("mb-2");
    toggle_assns.textContent = "Show Less Tasks";
});

collapse.addEventListener("shown.bs.collapse", () => {
    const placeholder_row = document.getElementById("scroll-center");
    scroll_offset = placeholder_row.offsetTop - collapse.offsetTop;
    setTimeout(() => {
        collapse.scrollTo({
            top: scroll_offset,
            behavior: "smooth",
        });
    }, 100);
})

collapse.addEventListener("hidden.bs.collapse", () => {
    top3_sec.classList.add("open");
    top3_sec.style.height = `${top3_sec.scrollHeight}px`;
    document.getElementById("assns-title-row").classList.add("mb-2");
    toggle_assns.textContent = "Show All Tasks";
});