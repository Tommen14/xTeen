//Made By Tommen_14


// DOM variables
const win = document.getElementById('window');
const container_series = document.getElementById('Fascia');
const continue_container_series = document.getElementById('continue_fascia');
const darker = document.getElementById('dark');
const poster = document.getElementById('poster');
const trailer = document.getElementById('trailer');
const ep_container = document.getElementById('episodies_container');
const discover_video = document.getElementById('discover_video');
const discover_image = document.getElementById('discover_image');


// state variables
let disc_on = true;
let scroll_pos;
let selected_film = false;

const Titles = [];
let keep_watching = [];

function formatta(text) {
    const new_t = text
    .replaceAll('--', '&')
    .replaceAll('-askm', '?')
    .replaceAll('-slash', '/')
    .replaceAll('-pnt', '.')
    .replaceAll('-dpnt', ':');
    return new_t;
}

class Title {

    constructor (name, father=container_series) {

        this.name = name;
        this.father = father;
        this.watching = father == continue_container_series;

        // creation of the DOM element
        this.cover = document.createElement("img");
        this.cover.classList.add(father == container_series ? 'watch':'watch_alt');
        this.cover.setAttribute('tabIndex', '0');

        const container = document.createElement('div');
        container.style.position = 'relative';
        
        // adding to the DOM 
        // and implementing the button to add to keep_watching
        if (father == container_series) {
            father.appendChild(container);
            container.appendChild(this.cover);

            this.add_button = document.createElement('button');
            this.add_button.classList.add('add_list');

            this.add_button.addEventListener('click', () => this.add_button_clicked());
            this.add_button.innerText = '+';

            container.appendChild(this.add_button);

        } else {
            father.appendChild(this.cover);
            this.cover.classList.add('continue_watch');
        }

        this.loadCoverImage()

        this.cover.addEventListener('click', () => { this.open_title(); });
    }

    async get_memory() {
        try {
            return await fetch(`api/memory?key=${this.name}`)
                .then(res => res.json())
                .then(data => {
                    if (data.message == 'chiave non trovata') throw new Error('not found');
                    return data.value;
                });
        } catch (_) {
            console.log('inizializzazione memoria di ', this.name);
            await fetch('api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: this.name, value: 0 })
            })
            .then(res => res.json())
            .then(data => console.log(data) );
            return 0;
        }
    }

    async loadCoverImage() {

        const apiURL = `/api/images/${encodeURIComponent(this.name)}`;
        try {
            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`Errore HTTP. Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.length > 0 && data[0].url) {
                this.cover.src = data[0].url; 
            } else {
                throw new Error("Dati immagine non validi o URL mancante");
            }

        } catch(error) {
            console.error("Errore nel caricamento delle immagini:", error);
        }
    }

    async open_title() {

        this.last_ep = this.father == continue_container_series && await this.get_memory();

        scroll_pos = scrollY;
        discover_video.pause();
        window.scrollTo(0, 0);

        win.classList.remove('hide');
        win.classList.add('show');

        document.getElementById('report_title').innerHTML = formatta(this.name);

        const imgApiURL = `/api/images/${encodeURIComponent(this.name)}`;
        try {
            const response = await fetch(imgApiURL);

            if (!response.ok) {
                throw new Error(`Errore HTTP. Status: ${response.status}`);
            }

            const data = await response.json(); 

            if (data.length > 0 && data[0].url) {
                poster.src = data[0].url; 
            } else {
                throw new Error("Dati immagine non validi o URL mancante");
            }

        } catch(error) {
            console.error("Errore nel caricamento delle immagini:", error);
        }

        darker.classList.remove('hide');
        selected_film = true;
    
        const apiURL = `/api/videos/${encodeURIComponent(this.name)}`;

        try {

            const response = await fetch(apiURL);
            if (!response.ok) { throw Error(`Serie non disponibile`) }

            const episodies = await response.json();

            ep_container.textContent = '';

            poster.onclick = () => {
                if (episodies.length > 0) {
                    trailer.src = episodies[0].url;
                    trailer.load();
                } else {
                    trailer.src = '';
                }
                poster.classList.add('hide');
                trailer.classList.remove('hide');
            };

            let prev_se = 0;

            for (let i = 1; i < episodies.length; i++) {

                const episodeData = episodies[i];
                const episodeInfo = episodeData.title.match(/S(\d+)\s*E(\d+)/i) || ['', 0, i];

                const link = document.createElement('p');
                const link_cont = document.createElement('div');
                const number = document.createElement('h4');

                link.setAttribute('role', 'button');
                link.setAttribute('tabindex', '0');
                link.classList.add("num_ep");
                link_cont.classList.add("num_ep_cont");
                number.classList.add("number_episode");

                number.innerText = episodeInfo[2];
                link.innerHTML = formatta(episodeData.title).split(' - ')[1] || `Episodio ${i}`;


                if (prev_se != episodeInfo[1] && episodies[episodies.length-1].title.match(/S(\d+)\s*E(\d+)/i)[1] > 1) {
                    const season_divide = document.createElement('h3');
                    season_divide.innerHTML = `Stagione ${episodeInfo[1]}`;
                    if (episodeInfo[1] == '1') {season_divide.style.marginTop = '0'}
                    season_divide.classList.add('season_divide');
                    ep_container.appendChild(season_divide);
                }
                prev_se = episodeInfo[1];

                ep_container.appendChild(link_cont);
                link_cont.appendChild(number);
                link_cont.appendChild(link);

                link.addEventListener('click', () => this.link_clicked(i, episodeData));
                
                if (this.father == continue_container_series && this.last_ep == i) { this.link_clicked(i, episodeData) }
            }


        } catch (error) {
            console.error("Errore nel recupero degli episodi:", error);
            ep_container.innerHTML = `<h3>Errore di Caricamento.</h3><p>Dettagli: ${error.message}</p>`;
        }
        
    }

    async link_clicked(num, episodeData) {

        let ep_text = episodeData.title.split(' - ').length > 0 ? `${episodeData.title.split(' - ')[0]}: ${episodeData.title.split(' - ')[1]}` : `Episodio ${num}`
        document.getElementById('report_ep').innerHTML = formatta(ep_text);
        window.scrollTo(0, 0);
        trailer.classList.remove('hide');
        poster.classList.add('hide');

        this.last_ep = num;

        if (this.watching) {
            await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: this.name, value: this.last_ep })
            });
        }

        trailer.src = episodeData.url;
        trailer.load();
    }

    async add_button_clicked() {
        this.watching = !this.watching;
        reload_watching(this.name, this.watching);
        if (this.father == container_series) {
            this.add_button.classList.toggle('add_clicked');
            setTimeout(() => { this.add_button.innerHTML = this.add_button.classList.contains('add_clicked') ? '-' : '+'; }, 200);
        }
        if (!this.watching) {
            await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: this.name, value: 0 })
            });
        }
    }
}

async function loadTitles() {
    try {

        const response = await fetch('/api/catalogo');
        if (!response.ok) { throw new Error('impossibile caricare catalogo'); }
    
        const catalogue = await response.json();
    
        catalogue.forEach(serie => {
            if (!serie.name.includes('@')) {
                Titles.push(new Title(serie.name));
            }
        });
    
        if (Titles.length > 0) { loadDiscoverVideo(); }

        for (titolo of Titles) {
            const mem = await titolo.get_memory();
            if (mem > 0) { titolo.add_button_clicked(); }

            titolo.last_ep = mem;
        }
    
    } catch (err) {
        console.error('errore nel caricamento del catalogo: ', err)
    }
    
}

function reload_watching(tit, act=true) {
    if (act) { keep_watching.push(new Title(tit, continue_container_series)); }
    else {
        keep_watching.forEach(el => { 
            if (el.name == tit) {
                const remove_ind = keep_watching.indexOf(el);
                continue_container_series.removeChild(el.cover);
                if (remove_ind != -1) { keep_watching.splice(remove_ind, 1) };
            }
        });
    }

    const decs = document.getElementById('continue_container');
    if (keep_watching.length > 0) {
        decs.classList.remove('hide');
    } else {
        decs.classList.add('hide');
    }
}

document.addEventListener('DOMContentLoaded', loadTitles)

document.getElementById('titolo').addEventListener('click', () => window.location.reload());

darker.addEventListener('click', () => {

    trailer.src = ''
    trailer.classList.add('hide')
    poster.classList.remove('hide')
    document.getElementById('report_ep').innerHTML = '';
    window.scrollTo(0, scroll_pos); 
    if (window.outerWidth > 700 && disc_on) { discover_video.play(); }

    win.classList.add('hide');
    win.classList.remove('show');

    document.getElementById('report_title').innerHTML = '';
    poster.src = '';

    darker.classList.add('hide');
    selected_film = false;
});

let random;
async function loadDiscoverVideo() {

    random = Math.floor(Math.random() * Titles.length);
    const selectedTitle = Titles[random];
    
    const apiUrl = `/api/videos/${encodeURIComponent(selectedTitle.name)}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) { throw new Error(`Errore nel caricamento del trailer: ${selectedTitle.name}`); }
        
        const episodes = await response.json();
        
        if (episodes.length > 0) {

            const trailerUrl = episodes[0].url; 
            
            discover_video.src = trailerUrl;
            discover_video.load();
            discover_video.play();
            
            discover_video.classList.remove("hide");
            discover_video.classList.add("discover_video");

            discover_image.classList.add("hide");
            discover_image.classList.remove("discover_video");
        } else {
            console.warn(`Nessun video trovato per ${selectedTitle.name}. Visualizzo solo il poster.`);
        }

    } catch (error) {
        discover_video.classList.add("hide");
        discover_video.classList.remove("discover_video");
        console.error("Errore fetch Discover:", error);
    }

    discover_video.addEventListener("ended", async () => {
        disc_on = false
        const discoverImgApiURL = `/api/images/${selectedTitle.name}`;
        try {
            const response = await fetch(discoverImgApiURL);

            if (!response.ok) {
                throw new Error(`Errore HTTP. Status: ${response.status}`);
            }

            const data = await response.json(); 

            if (data.length > 0 && data[0].url) {
                document.getElementById('discover_image').src = data[0].url;
                discover_image.classList.remove("hide");
                discover_image.classList.add("discover_video");
                discover_video.remove();
            } else {
                throw new Error("Dati immagine non validi o URL mancante");
            }

        } catch(error) {
            console.error("Errore nel caricamento delle immagini:", error);
        }
    });
}

document.getElementById('audio_button').addEventListener("click", () => {
    discover_video.muted = !discover_video.muted;
    document.getElementById('audio_button').src = discover_video.muted ? 'assets/images/Mute.png' : 'assets/images/Audio_Button.png';
});

document.getElementById('play_button').addEventListener("click", () => {
    Titles[random].open_title();
});

document.addEventListener('keydown', ev => {
    if (selected_film) {
        if (!trailer.classList.contains('hide')) {
            switch (ev.key) {
                case ' ':
                    ev.preventDefault();
                    trailer.paused ? trailer.play() : trailer.pause();
                    break
                case 'f':
                    ev.preventDefault();
                    document.fullscreenElement ? document.exitFullscreen() : trailer.requestFullscreen();
                    document.fullscreenElement ? document.webkitExitFullscreen() : trailer.webkitRequestFullscreen();
                    break
                case 'm':
                    ev.preventDefault();
                    trailer.muted = !trailer.muted;
                    break
                case 'ArrowLeft':
                    ev.preventDefault()
                    trailer.currentTime -= 10;
                    break
                case 'ArrowRight':
                    ev.preventDefault()
                    trailer.currentTime += 10;
                    break
            }
        } else if (ev.key == ' ') { ev.preventDefault(); poster.click(); }
    }
});