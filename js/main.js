let ticker_id = null
let timer_id = null
let enabled = false
let alive_count = 4

// query selectors
const board = document.getElementById('board')
const disc1 = document.getElementById('disc1')
const disc2 = document.getElementById('disc2')
const disc3 = document.getElementById('disc3')
const disc4 = document.getElementById('disc4')
const g_alert = document.getElementById('gameover_alert')
const timer = document.getElementById('timer')
const btn_start = document.getElementById('btn_start')
const btn_pause = document.getElementById('btn_pause')
const btn_reset = document.getElementById('btn_reset')

const discs = [disc1, disc2, disc3, disc4]

// state variable, holds location and speed information for each disc
let g_state = [
    {
        x: 0,                       // location in x axis
        y: Math.random() * 90 + 5,  // location in y axis
        xv: Math.random(),          // velocity in x axis
        yv: Math.random(),          // velocity in y axis
        alive: true
    },
    {
        x: Math.random() * 90 + 5,
        y: 0,
        xv: Math.random(),
        yv: Math.random(),
        alive: true
    },
    {
        x: 100,
        y: Math.random() * 90 + 5,
        xv: Math.random(),
        yv: Math.random(),
        alive: true
    },
    {
        x: Math.random() * 90 + 5,
        y: 100,
        xv: Math.random(),
        yv: Math.random(),
        alive: true
    }
]
const saved_state = JSON.parse(JSON.stringify(g_state)) // save initial state

// calculate new positions based on velocity and handle wall collision
function calculate_pos() {
    g_state.forEach(d => {
        if (!d.alive) return
        (d.x + d.xv >= 100 || d.x + d.xv <= 0) ? d.xv *= -1 : d.x += d.xv;
        (d.y + d.yv >= 100 || d.y + d.yv <= 0) ? d.yv *= -1 : d.y += d.yv;
    });
}

const collision_sensitivity = 5 // i tried several values, 5 seems to work best accross different resolutions

function detect_collision() {
    for (let i = 0; i < 3; i++) {
        for (let j = i+1; j < 4; j++) {
            let di = g_state[i], dj = g_state[j]
            if (di.alive && dj.alive && Math.sqrt(Math.pow(di.x - dj.x, 2) + Math.pow(di.y - dj.y, 2)) < collision_sensitivity)
            {
                // collision detected! the faster disc will absorb the slower one
                let di_speed = Math.sqrt(Math.pow(di.xv, 2) + Math.pow(di.yv, 2))
                let dj_speed = Math.sqrt(Math.pow(dj.xv, 2) + Math.pow(dj.yv, 2))
                if (di_speed >= dj_speed) {
                    handle_collision(di, dj)
                    discs[j].setAttribute('hidden', 'true')
                } else {
                    handle_collision(dj, di)
                    discs[i].setAttribute('hidden', 'true')
                }
            }
        }
    }
}

function handle_collision(d1, d2) {
    if ((d1.xv > 0 && d2.xv < 0) || (d1.xv < 0 && d2.xv > 0))
        d1.xv += d2.xv
    else   
        d1.yv *= -1
    
    if ((d1.yv > 0 && d2.yv < 0) || (d1.yv < 0 && d1.yv > 0))
        d1.yv += d2.yv
    else
        d1.xv *= -1
    
    d2.alive = false
    alive_count--
}

// apply new position for each disc
function render_pos() {
    discs.forEach((disc,i) => {
        disc.style.cssText = `top:${g_state[i].y}%; left:${g_state[i].x}%;`
    });
}

// Event Handlers
window.addEventListener('load', setup)
window.addEventListener('keydown', handle_keypress)
timer.addEventListener('input', handle_timer_input)
btn_start.addEventListener('click', handle_start)
btn_pause.addEventListener('click', handle_pause)
btn_reset.addEventListener('click', handle_reset)
window.addEventListener('beforeunload', handle_close)

function setup() {
    timer.max_value = 60 // timer is set to 1 minute by default, max_value is a custom property
    render_pos() // apply initial positions to discs
}

function handle_close(e) {
    if (enabled) 
        e.returnValue = 'Are you sure?' // alert before leaving page while game is still ongoing
}

function handle_start() {
    btn_start.classList.add('active')
    btn_pause.classList.remove('active')
    btn_reset.classList.remove('active')

    if (!ticker_id)
        ticker_id = window.setInterval(handle_tick, 15) // initialize ticker
    if (!timer_id) 
        timer_id = window.setInterval(handle_timer_tick, 1000) // initialize timer
    if (alive_count > 1) 
        enabled = true
}

function handle_pause() {
    btn_pause.classList.add('active')
    btn_start.classList.remove('active')
    enabled = false // stop disc movement
}

function handle_reset() {
    btn_reset.classList.add('active')
    btn_pause.classList.remove('active')
    btn_start.classList.remove('active')

    enabled = false // stop disc movement
    alive_count = 4
    g_state = JSON.parse(JSON.stringify(saved_state)) // reset discs position
    discs.forEach(disc => { 
        disc.removeAttribute('hidden') // show all discs
        disc.classList.remove('gameover') // reset color
    });
    g_alert.style.opacity = '0' // hide game over alert
    timer.value = timer.max_value // reset timer
    timer.style.transitionDuration = '0s'
    timer.style.backgroundSize = '100% 100%' // reset progress bar
    render_pos()
}

function handle_keypress(e) {
    switch (e.keyCode) {
        case 83: // s
            return handle_start()
        case 80: // p
            return handle_pause()
        case 82: // r
            return handle_reset()
        default:
            break;
    }
}

function handle_tick() {
    if (!enabled) return
    calculate_pos()
    detect_collision()
    if (timer.value == 0 || alive_count == 1) 
        handle_game_over()
    else 
        render_pos()
}

function handle_timer_tick() {
    if (enabled)
        timer.style.cssText = `background-size: ${--timer.value * 100 / timer.max_value}% 100%` // progress bar
}

function handle_timer_input() {
    timer.max_value = timer.value // set max_value for progress bar calculations
}

function handle_game_over() {
    enabled = false
    g_alert.style.opacity = '75%' // show alert
    discs.forEach(disc => {
        disc.classList.add('gameover') // color remaining discs green
    })
}