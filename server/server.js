//Made by Tommen_14

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = 3000;

const publicPath = path.join(__dirname, '..', 'client');
const assetsPath = path.join(__dirname, 'assets');
const memory_path = path.join(__dirname, 'watching_memory.json');

app.use(express.json());

async function ottieni_memoria() {
    try {
        const data = await fs.readFile(memory_path, 'utf-8');

        if (!data || data.trim() == '') {
            return {};
        }

        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return {}; //file non trovato
        }
        throw err;
    }
}

async function scrivi_memoria(data) {
    await fs.writeFile(memory_path, JSON.stringify(data, null, 2), 'utf-8');
}

function OrdinaEpisodi(title) {

    const seMatch = title.match(/S(\d+)\s*E(\d+)/i);
    if (seMatch) {
        return {
            season: parseInt(seMatch[1], 10),
            episode: parseInt(seMatch[2], 10)
        };
    }

    const sMatch = title.match(/S(\d+)/i);
    const eMatch = title.match(/(?:ep|e)\s*(\d+)/i);

    return {
        season: sMatch ? parseInt(sMatch[1], 10) : 0,
        episode: eMatch ? parseInt(eMatch[1], 10) : 0
    };
}

app.get('/api/catalogo', async (req, res) => {
    try {
        const items = await fs.readdir(assetsPath, {withFileTypes: true});

        const series = items
            .filter(item => item.isDirectory())
            .map(item => ( { name: item.name } ));

        res.json(series)
    }
    catch (err) {
        console.error('Errore nella scansione del catalogo: ', err);
        res.status(500).json({ message: 'Errore del server nella scansione del file system' })

    }
});

app.get('/api/videos/:serie', async (req, res) => {

    if (req.params.serie.includes('..')) {
        return res.status(400).json({ message: 'input non valido' });
    }
    
    console.log(`Richiesta API video ricevuta. Serie: "${req.params.serie}"`);
    const serieRichiesta = path.basename(req.params.serie);
    const seriePath = path.join(assetsPath, serieRichiesta);

    try {
        const stat = await fs.stat(seriePath);

        if (!stat.isDirectory()) { return res.status(404).json({ message: 'serie non trovata'}); }

        const files = await fs.readdir(seriePath)
        const videoData = files
            .filter(file => file.toLowerCase().endsWith('.mp4'))
            .map((file) => ({
                id: file,
                title: file.replace('.mp4', ''),
                url: `/assets/${serieRichiesta}/${file}`
            }));

        res.json(
            videoData.sort((a, b) => {
                const A = OrdinaEpisodi(a.title);
                const B = OrdinaEpisodi(b.title);

                if (A.season !== B.season) {
                    return A.season - B.season;
                }

                return A.episode - B.episode;
            }
        ));

    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ message: 'serie non trovata' });
        }
        return res.status(500).json({ message: 'errore del server'});
    }
});

app.get('/api/images/:serie', async (req, res) => {
    
    if (req.params.serie.includes('..')) {
        return res.status(400).json({ message: 'input non valido' });
    }

    const serieRichiesta = req.params.serie;
    const fileName = `${serieRichiesta}.jpg`;
    const fullImagePath = path.join(assetsPath, serieRichiesta, fileName); 
    
    console.log(`Richiesta API immagine. File atteso: "${fullImagePath}"`);

    try {

        await fs.access(fullImagePath);

        const imgData = [{
            id: 0,
            title: serieRichiesta,
            url: `/assets/${serieRichiesta}/${fileName}` 
        }];
        
        console.log("Data: ", imgData);
        res.json(imgData);

    } catch (err) {
        console.error(`File immagine non trovato per la serie ${serieRichiesta}: `, err.message);
        res.status(404).json({ message: `Immagine per la serie "${serieRichiesta}" non trovata`});
    }
});

app.get('/api/memory', async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) return res.status(400).send({ message: 'chiave non specificata' });

        const data = await ottieni_memoria();

        if (key in data) {
            res.json({ key, value: data[key] });
        } else {
            res.status(404).json({ message: 'chiave non trovata' });
        }

    } catch (err) {
        console.log('errore di lettura: ', err);
        res.status(500).send({ message: 'errore del server nella lettura della memoria' });
    }
});

app.post('/api/memory', async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || typeof value == 'undefined') return res.status(400).json({ message: 'chiave o valore mancante' });

        const data = await ottieni_memoria();
        const isUpdate = key in data;

        data[key] = value;
        await scrivi_memoria(data);

        res.json({
            message: isUpdate ? 'chiave aggiornata' : 'chiave aggiunta',
            key,
            value
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
})

app.use('/assets', express.static(assetsPath));
app.use(express.static(publicPath)); 

app.listen(PORT, () => {
    console.log(`Server Express in esecuzione su http://localhost:${PORT}`);
    console.log(`Apri http://localhost:${PORT} nel tuo browser.`);
});
