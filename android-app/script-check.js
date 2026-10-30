
        // ============================================================
        // Configuración de Firebase
        // ============================================================
        const firebaseConfig = {
            apiKey: "AIzaSyBYXICYKd8lJLwwgSLR3-KIsfFiyvmyFiU",
            authDomain: "juego-cruzado.firebaseapp.com",
            databaseURL: "https://juego-cruzado-default-rtdb.firebaseio.com",
            projectId: "juego-cruzado",
            storageBucket: "juego-cruzado.firebasestorage.app",
            messagingSenderId: "76826915440",
            appId: "1:76826915440:web:aab5727144c4a038cc3ab5",
            measurementId: "G-GC2QYZM7GY"
        };

        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const authReady = auth.signInAnonymously();
        const db = firebase.database();

        function newRoomCode() {
            const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            const random = new Uint8Array(12);
            crypto.getRandomValues(random);
            return Array.from(random, byte => alphabet[byte % alphabet.length]).join('');
        }

        const roomParam = new URLSearchParams(location.search).get('sala');
        let roomCode = (roomParam || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
        if (!roomCode) roomCode = (localStorage.getItem('chispa_room') || '').toUpperCase();
        if (!roomCode || roomCode === 'PUBLICA') roomCode = newRoomCode();
        localStorage.setItem('chispa_room', roomCode);
        const roomLabel = document.getElementById('roomLabel');
        roomLabel.textContent = `Sala: ${roomCode}`;
        document.getElementById('roomCodeInput').value = roomCode === 'PUBLICA' ? '' : roomCode;
        const roomRoot = `salas/${roomCode}`;
        const memberRef = db.ref(`${roomRoot}/miembros`);
        const deckLabels = { coqueteo: '❤️ Coqueteo', sensaciones: '🔥 Sensaciones', intimidad: '💜 Intimidad' };
        const legacyGameRefs = Object.fromEntries(Object.keys(deckLabels).map(deckId => [deckId, db.ref(`${roomRoot}/mazos/${deckId}/gameData`)]));
        const gameRef = db.ref(`${roomRoot}/gameData`);
        const presenceRef = db.ref(`${roomRoot}/presences`);

        const LIMITE_COMODINES = 2;

        // ============================================================
        // Mazo
        // ============================================================
        const legacyDeck = [
            // Nivel 1 (Preludio)
            { id: 1, level: "Nivel 1: Coqueteo", title: "Un detalle", desc: "Dile a tu pareja qué detalle suyo te parece irresistible. En modo grupo, cada quien elige a quién decírselo.", points: 1, type: "Nivel 1", mode: "both" },
            { id: 2, level: "Nivel 1: Coqueteo", title: "Mensaje secreto", desc: "Escribe una frase coqueta para tu pareja; en modo grupo, envíasela a alguien de la otra pareja.", points: 1, type: "Nivel 1", mode: "both" },
            { id: 3, level: "Nivel 1: Coqueteo", title: "Beso a elección", desc: "Comparte un beso breve con tu pareja. En grupo, elige a alguien de la otra pareja. También vale mandarlo a distancia.", points: 1, type: "Nivel 1", mode: "both" },
            { id: 4, level: "Nivel 1: Coqueteo", title: "Tres cosas", desc: "Nombra tres cosas que te gustaría probar en una cita.", points: 1, type: "Nivel 1", mode: "both" },
            { id: 5, level: "Nivel 1: Coqueteo", title: "Mirada", desc: "Sostén la mirada de tu pareja por 20 segundos y luego dile qué te gustaría hacer en su próxima cita.", points: 1, type: "Nivel 1", mode: "pareja" },
            { id: 6, level: "Nivel 1: Coqueteo", title: "Fantasía ligera", desc: "Cuenta una fantasía romántica o sensual que te gustaría explorar algún día.", points: 1, type: "Nivel 1", mode: "both" },
            { id: 7, level: "Nivel 1: Coqueteo", title: "Playlist", desc: "Elige una canción que te ponga de buen humor para seducir y explica por qué.", points: 1, type: "Nivel 1", mode: "both" },
            { id: 8, level: "Nivel 1: Coqueteo", title: "Un deseo", desc: "Pídele a tu pareja un gesto cariñoso concreto: un abrazo, una caricia en la mano o un cumplido.", points: 1, type: "Nivel 1", mode: "pareja" },

            // Nivel 2 (Temperatura Media)
            { id: 9, level: "Nivel 2: Más cerca", title: "Masaje lento", desc: "Da un masaje de hombros de dos minutos, alternando presión suave y firme.", points: 3, type: "Nivel 2", mode: "both" },
            { id: 10, level: "Nivel 2: Más cerca", title: "Baile privado", desc: "Baila una canción para tu pareja. Tú decides cuánto mostrar; no se graba.", points: 3, type: "Nivel 2", mode: "pareja" },
            { id: 11, level: "Nivel 2: Más cerca", title: "Beso lento", desc: "Comparte un beso lento de 20 segundos; si prefieren algo más suave, tómense de las manos y mantengan la mirada.", points: 3, type: "Nivel 2", mode: "both" },
            { id: 12, level: "Nivel 2: Más cerca", title: "Guía de caricias", desc: "Por turnos, guía las manos de tu pareja por las zonas que más disfrutas y déjate guiar por ella.", points: 3, type: "Nivel 2", mode: "pareja" },
            { id: 13, level: "Nivel 2: Más cerca", title: "Confesión", desc: "Completa: «Me siento más deseado/a cuando…». Escucha sin juzgar.", points: 3, type: "Nivel 2", mode: "both" },
            { id: 14, level: "Nivel 2: Más cerca", title: "Vestuario", desc: "Elige una prenda para cambiarte o quitarte; si prefieres, elige la próxima canción.", points: 3, type: "Nivel 2", mode: "both" },
            { id: 15, level: "Nivel 2: Más cerca", title: "Mordida suave", desc: "Besa el cuello o el hombro de tu pareja y termina con una mordida suave.", points: 3, type: "Nivel 2", mode: "both" },
            { id: 16, level: "Nivel 2: Más cerca", title: "Anticipación", desc: "Susurra al oído de tu pareja algo que te gustaría hacer en privado más tarde.", points: 3, type: "Nivel 2", mode: "pareja" },

            // Nivel 3 (Alto Voltaje)
            { id: 17, level: "Nivel 3: Alto Voltaje", title: "Foto espejo", desc: "Cada pareja crea una foto sugerente para el chat privado de la partida. Puede ser una pose, un detalle o una foto que ya tengan ganas de compartir.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 18, level: "Nivel 3: Alto Voltaje", title: "Audio al oído", desc: "Graba una nota de voz breve susurrando una fantasía o una frase seductora para tu pareja y compártela con el grupo.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 19, level: "Nivel 3: Alto Voltaje", title: "Striptease al cronómetro", desc: "Una persona de cada pareja hace un striptease de 90 segundos para su pareja mientras la otra pareja observa.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 20, level: "Nivel 3: Alto Voltaje", title: "Sexting en espejo", desc: "Cada pareja escribe una escena sensual de tres mensajes. Luego intercambian escenas y cada quien responde con una nota de voz.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 21, level: "Nivel 3: Alto Voltaje", title: "Cita relámpago", desc: "Por dos minutos, cada pareja coquetea como si recién se conociera: presentación, cumplido y una invitación atrevida.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 22, level: "Nivel 3: Alto Voltaje", title: "Reto de vestuario", desc: "Tu pareja elige una prenda tuya para una mini pasarela frente al grupo. Cierra con una pose de portada.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 23, level: "Nivel 3: Alto Voltaje", title: "Escena sin palabras", desc: "Cada pareja representa durante un minuto una escena de seducción usando solo miradas y gestos. La otra pareja elige el título de la escena.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 24, level: "Nivel 3: Alto Voltaje", title: "Baile a cuatro", desc: "Pongan una canción y armen entre todos un baile sensual sincronizado de 30 segundos. Repítanlo una vez, con más actitud.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 25, level: "Nivel 3: Alto Voltaje", title: "Intercambio express", desc: "Cambien de pareja durante cinco minutos y compartan un baile lento, un beso o caricias por encima de la ropa.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 26, level: "Nivel 3: Alto Voltaje", title: "Cita cruzada", desc: "Con la pareja intercambiada, improvisen una primera cita de tres minutos: cumplidos, miradas y una invitación atrevida.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 27, level: "Nivel 3: Alto Voltaje", title: "Masaje cruzado", desc: "Intercambien parejas y den un masaje lento de tres minutos en hombros y espalda.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 28, level: "Nivel 3: Alto Voltaje", title: "Foto de portada", desc: "Cada pareja arma una pose sensual de portada y la comparte en el chat privado de la partida.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 29, level: "Nivel 3: Alto Voltaje", title: "Ronda de susurros", desc: "Por turnos, susurra a tu pareja una frase provocadora. La otra pareja elige quién tuvo la mejor interpretación.", points: 5, type: "Nivel 3", mode: "grupo" },
            { id: 30, level: "Nivel 3: Alto Voltaje", title: "Pasarela de parejas", desc: "Cada pareja prepara una pasarela sensual de 45 segundos con una canción elegida por la otra pareja.", points: 5, type: "Nivel 3", mode: "grupo" },

            // Comodines
            { id: 31, level: "Comodines", title: "Paso libre", desc: "Pasa cualquier carta sin dar explicaciones y roba otra o termina el turno. No se restan puntos.", points: 0, type: "Comodín", mode: "both" },
            { id: 32, level: "Comodines", title: "A mi manera", desc: "Cambia el reto por una versión más cómoda o menos intensa que elijas.", points: 0, type: "Comodín", mode: "both" },
            { id: 33, level: "Comodines", title: "Cambio de turno", desc: "Descarta la carta y pasa el turno. Nadie recibe el reto por otra persona.", points: 0, type: "Comodín", mode: "both" },
            { id: 34, level: "Comodines", title: "Pausa", desc: "Pausa el juego, conversen o terminen la partida. El bienestar está primero.", points: 0, type: "Comodín", mode: "both" }
        ];
        const suppliedDeckCards = [
            // Mazo 1 — Coqueteo
            { id:101, deckId:'coqueteo', level:'Coqueteo', title:'Mirada y caricias', desc:'Mírense 5 segundos; quien roba la carta acaricia la nuca de su pareja.', groupDesc:'En modo doble, quien roba elige a alguien de la otra pareja, cruzan una mirada breve y le acaricia la nuca.', points:1, type:'Nivel 1', mode:'both' },
            { id:102, deckId:'coqueteo', level:'Coqueteo', title:'Tres besos en el cuello', desc:'Da tres besos lentos en el cuello de tu pareja.', groupDesc:'En modo doble, elige a alguien de la otra pareja y dale tres besos lentos en el cuello.', points:1, type:'Nivel 1', mode:'both' },
            { id:103, deckId:'coqueteo', level:'Coqueteo', title:'Dedos por la clavícula', desc:'Recorre la clavícula de tu pareja con las yemas de los dedos y termina con un beso.', groupDesc:'En modo doble, recorre con los dedos la clavícula de alguien de la otra pareja y termina con un beso breve.', points:1, type:'Nivel 1', mode:'both' },
            { id:104, deckId:'coqueteo', level:'Coqueteo', title:'Masaje de hombros', desc:'Quien roba la carta da a su pareja un masaje breve de hombros y nuca; puede añadir libremente otra caricia o acción breve.', groupDesc:'En modo doble, quien roba puede elegir a alguien de la otra pareja para el masaje de hombros y nuca, y sumar libremente otra caricia o acción breve.', points:1, type:'Nivel 1', mode:'both' },
            { id:105, deckId:'coqueteo', level:'Coqueteo', title:'Beso en la clavícula', desc:'Besa lentamente la clavícula de tu pareja y acaricia su hombro.', groupDesc:'En modo doble, elige a alguien de la otra pareja: un beso en la clavícula y una caricia en el hombro.', points:1, type:'Nivel 1', mode:'both' },
            { id:106, deckId:'coqueteo', level:'Coqueteo', title:'Caricias por la espalda', desc:'Pasa las manos por la espalda de tu pareja sobre la ropa durante 20 segundos.', groupDesc:'En modo doble, acaricia durante 20 segundos la espalda de alguien de la otra pareja por encima de la ropa.', points:1, type:'Nivel 1', mode:'both' },
            { id:107, deckId:'coqueteo', level:'Coqueteo', title:'Detrás de la oreja', desc:'Acaricia detrás de la oreja y por el cuello de tu pareja; termina con un beso.', groupDesc:'En modo doble, acaricia detrás de la oreja y el cuello de alguien de la otra pareja y termina con un beso breve.', points:1, type:'Nivel 1', mode:'both' },
            { id:108, deckId:'coqueteo', level:'Coqueteo', title:'Caricias por el brazo', desc:'Recorre el brazo de tu pareja desde el hombro hasta la mano con toques lentos.', groupDesc:'En modo doble, recorre lentamente el brazo de alguien de la otra pareja desde el hombro hasta la mano.', points:1, type:'Nivel 1', mode:'both' },
            { id:109, deckId:'coqueteo', level:'Coqueteo', title:'Besos en la mano', desc:'Besa la mano de tu pareja, desde las puntas de los dedos hasta la muñeca y el antebrazo.', groupDesc:'En modo doble, elige a alguien de la otra pareja y besa su mano, muñeca y antebrazo hasta cerca del codo.', points:1, type:'Nivel 1', mode:'both' },
            { id:110, deckId:'coqueteo', level:'Coqueteo', title:'Beso y manos inquietas', desc:'Quien roba la carta comparte un beso breve con su pareja mientras acaricia su cintura y muslos por encima de la ropa durante 20 segundos.', groupDesc:'En modo doble, elige a alguien de la otra pareja para un beso breve y caricias en cintura y muslos por encima de la ropa durante 20 segundos.', points:1, type:'Nivel 1', mode:'both' },
            { id:111, deckId:'coqueteo', level:'Coqueteo', title:'Caricias con algo de casa', desc:'Usa una camiseta limpia, una toalla suave o una funda de almohada para acariciar cuello, hombros o brazos de tu pareja.', groupDesc:'En modo doble, usa una camiseta limpia, una toalla suave o una funda de almohada para acariciar cuello, hombros o brazos de alguien de la otra pareja.', points:1, type:'Nivel 1', mode:'both' },
            { id:112, deckId:'coqueteo', level:'Coqueteo', title:'Abrazo por detrás', desc:'Abraza a tu pareja por detrás, acaríciale la cintura y bésale el cuello.', groupDesc:'En modo doble, abraza por detrás a alguien de la otra pareja, acaríciale la cintura y dale un beso en el cuello.', points:1, type:'Nivel 1', mode:'both' },
            { id:113, deckId:'coqueteo', level:'Coqueteo', title:'Beso en la cintura', desc:'Besa la cintura de tu pareja por encima de la ropa y deja ahí las manos unos segundos.', groupDesc:'En modo doble, besa la cintura por encima de la ropa de alguien de la otra pareja y acaríciala unos segundos.', points:1, type:'Nivel 1', mode:'both' },
            { id:114, deckId:'coqueteo', level:'Coqueteo', title:'Manos sobre la ropa', desc:'Recorre con las manos el torso de tu pareja por encima de la ropa durante 20 segundos.', groupDesc:'En modo doble, recorre durante 20 segundos el torso de alguien de la otra pareja por encima de la ropa.', points:1, type:'Nivel 1', mode:'both' },
            { id:115, deckId:'coqueteo', level:'Coqueteo', title:'Guía mis manos', desc:'Guía las manos de tu pareja por las zonas de tu cuerpo que quieres que acaricie, por encima de la ropa.', groupDesc:'En modo doble, guía las manos de alguien de la otra pareja hacia una zona que quieras que acaricie por encima de la ropa.', points:1, type:'Nivel 1', mode:'both' },
            { id:116, deckId:'coqueteo', level:'Coqueteo', title:'Masaje de muslos', desc:'Da a tu pareja un masaje breve en los muslos por encima de la ropa.', groupDesc:'En modo doble, da a alguien de la otra pareja un masaje breve en los muslos por encima de la ropa.', points:1, type:'Nivel 1', mode:'both' },
            { id:117, deckId:'coqueteo', level:'Coqueteo', title:'Beso del hombro al cuello', desc:'Besa despacio a tu pareja desde el hombro hasta el cuello.', groupDesc:'En modo doble, elige a alguien de la otra pareja y dale un beso desde el hombro hasta el cuello.', points:1, type:'Nivel 1', mode:'both' },
            { id:118, deckId:'coqueteo', level:'Coqueteo', title:'Tres besos, tres caricias', desc:'Da tres besos en distintas zonas del cuello y acompaña cada uno con una caricia.', groupDesc:'En modo doble, comparte con alguien de la otra pareja tres besos y caricias breves en cuello y hombros.', points:1, type:'Nivel 1', mode:'both' },
            { id:119, deckId:'coqueteo', level:'Coqueteo', title:'Cuerpos muy cerca', desc:'Acércate a tu pareja, pon las manos en su cintura y bésense durante 20 segundos.', groupDesc:'En modo doble, elige a alguien de la otra pareja: acérquense, manos a la cintura y un beso de 20 segundos.', points:1, type:'Nivel 1', mode:'both' },
            { id:120, deckId:'coqueteo', level:'Coqueteo', title:'Elige dónde acariciar', desc:'Tu pareja indica una zona cómoda para recibir 20 segundos de caricias.', groupDesc:'En modo doble, quien roba elige a alguien de la otra pareja; esa persona señala una zona para recibir 20 segundos de caricias.', points:1, type:'Nivel 1', mode:'both' },

            { id:161, deckId:'coqueteo', level:'Coqueteo', title:'Caricia cruzada', desc:'En modo doble, cada quien acaricia por encima de la ropa el brazo de la persona a su lado durante 15 segundos.', points:1, type:'Nivel 1', mode:'grupo' },
            { id:162, deckId:'coqueteo', level:'Coqueteo', title:'Beso de bienvenida', desc:'En modo doble, cada persona da un beso breve en la mejilla o el cuello a quien tiene enfrente.', points:1, type:'Nivel 1', mode:'grupo' },
            { id:163, deckId:'coqueteo', level:'Coqueteo', title:'Cinturas en pareja', desc:'En modo doble, cada pareja se acerca, pone las manos en la cintura y comparte un beso corto.', points:1, type:'Nivel 1', mode:'grupo' },
            { id:164, deckId:'coqueteo', level:'Coqueteo', title:'Guiño y caricia', desc:'En modo doble, elige a alguien de la otra pareja: un guiño y una caricia breve en el antebrazo.', points:1, type:'Nivel 1', mode:'grupo' },
            { id:165, deckId:'coqueteo', level:'Coqueteo', title:'Beso por turnos', desc:'En modo doble, cada persona elige a quién dar un beso breve en una zona acordada, como mejilla, cuello o mano.', points:1, type:'Nivel 1', mode:'grupo' },
            { id:166, deckId:'coqueteo', level:'Coqueteo', title:'Acércate', desc:'En modo doble, cada pareja se acerca y comparte 10 segundos de caricias por encima de la ropa.', points:1, type:'Nivel 1', mode:'grupo' },

            // Mazo 2 — Sensaciones
            { id:121, deckId:'sensaciones', level:'Sensaciones', title:'Manos que exploran', desc:'Quien roba la carta recorre brazos y hombros de su pareja por encima de la ropa durante 20 segundos.', points:3, type:'Nivel 2', mode:'both' },
            { id:122, deckId:'sensaciones', level:'Sensaciones', title:'Yemas y escalofrío', desc:'Pasa las yemas de los dedos por la nuca y el brazo de tu pareja, sin objetos, durante 15 segundos.', points:3, type:'Nivel 2', mode:'both' },
            { id:123, deckId:'sensaciones', level:'Sensaciones', title:'Palma con palma', desc:'Entrelacen las manos y acaricia con el pulgar la palma de tu pareja durante 15 segundos.', points:3, type:'Nivel 2', mode:'both' },
            { id:124, deckId:'sensaciones', level:'Sensaciones', title:'Ojos cerrados', desc:'Tu pareja cierra los ojos 10 segundos mientras le das una caricia o un beso sorpresa.', points:3, type:'Nivel 2', mode:'both' },
            { id:125, deckId:'sensaciones', level:'Sensaciones', title:'Adivina la caricia', desc:'Haz una caricia breve en la mano, el brazo o el cuello; tu pareja adivina dónde será la siguiente.', points:3, type:'Nivel 2', mode:'both' },
            { id:126, deckId:'sensaciones', level:'Sensaciones', title:'Caricia lenta', desc:'Desliza una mano lentamente por el costado de tu pareja por encima de la ropa.', points:3, type:'Nivel 2', mode:'both' },
            { id:127, deckId:'sensaciones', level:'Sensaciones', title:'Beso y susurro', desc:'Da un beso breve donde elija tu pareja y susúrrale una frase provocadora.', points:3, type:'Nivel 2', mode:'both' },
            { id:128, deckId:'sensaciones', level:'Sensaciones', title:'Cuello y hombros', desc:'Quien roba la carta acaricia cuello y hombros de su pareja con las manos durante 20 segundos.', points:3, type:'Nivel 2', mode:'both' },
            { id:129, deckId:'sensaciones', level:'Sensaciones', title:'Dedos por la cintura', desc:'Acaricia la cintura de tu pareja con las yemas de los dedos durante 15 segundos.', points:3, type:'Nivel 2', mode:'both' },
            { id:130, deckId:'sensaciones', level:'Sensaciones', title:'Balanceo silencioso', desc:'Abrácense y balanceen juntos durante 15 segundos, sin música ni hablar.', points:3, type:'Nivel 2', mode:'both' },
            { id:131, deckId:'sensaciones', level:'Sensaciones', title:'Muslos por encima de la ropa', desc:'Da un masaje breve en los muslos de tu pareja por encima de la ropa.', points:3, type:'Nivel 2', mode:'both' },
            { id:132, deckId:'sensaciones', level:'Sensaciones', title:'Beso y aliento', desc:'Da un beso en el cuello y deja que tu aliento roce la piel un instante.', points:3, type:'Nivel 2', mode:'both' },
            { id:133, deckId:'sensaciones', level:'Sensaciones', title:'Quédate quieta/o', desc:'Durante 15 segundos, tu pareja permanece quieta mientras le acaricias brazos, hombros o espalda.', points:3, type:'Nivel 2', mode:'both' },
            { id:134, deckId:'sensaciones', level:'Sensaciones', title:'Toma mi mano', desc:'Guía la mano de tu pareja hasta un lugar de tu cuerpo que quieras que acaricie por encima de la ropa.', points:3, type:'Nivel 2', mode:'both' },
            { id:135, deckId:'sensaciones', level:'Sensaciones', title:'Caricia por turnos', desc:'Cada integrante de la pareja acaricia al otro durante 10 segundos en una zona que elija quien recibe.', points:3, type:'Nivel 2', mode:'both' },
            { id:136, deckId:'sensaciones', level:'Sensaciones', title:'Cambio de lado', desc:'Cambien de lado y repitan durante 10 segundos la última caricia.', points:3, type:'Nivel 2', mode:'both' },
            { id:137, deckId:'sensaciones', level:'Sensaciones', title:'Tu zona favorita', desc:'Tu pareja elige una zona cómoda y tú la acaricias durante 20 segundos.', points:3, type:'Nivel 2', mode:'both' },
            { id:138, deckId:'sensaciones', level:'Sensaciones', title:'Presión suave', desc:'Acaricia a tu pareja con presión suave desde la espalda hasta la cintura, por encima de la ropa.', points:3, type:'Nivel 2', mode:'both' },
            { id:139, deckId:'sensaciones', level:'Sensaciones', title:'Tres caricias', desc:'Da tres caricias lentas en el brazo, el cuello o la cintura de tu pareja.', points:3, type:'Nivel 2', mode:'both' },
            { id:140, deckId:'sensaciones', level:'Sensaciones', title:'Muy cerca', desc:'Acércate a tu pareja, acaríciale la cintura y bésense durante 15 segundos.', points:3, type:'Nivel 2', mode:'both' },

            // Mazo 3 — Intimidad
            { id:141, deckId:'intimidad', level:'Intimidad', title:'Mano bajo la camiseta', desc:'Quien roba la carta acaricia el abdomen de su pareja bajo la camiseta durante 20 segundos.', points:5, type:'Nivel 3', mode:'both' },
            { id:142, deckId:'intimidad', level:'Intimidad', title:'Muslos por dentro', desc:'Acaricia con suavidad la cara interna del muslo de tu pareja durante 20 segundos.', points:5, type:'Nivel 3', mode:'both' },
            { id:143, deckId:'intimidad', level:'Intimidad', title:'Besos que bajan', desc:'Da tres besos desde el cuello hasta el pecho de tu pareja, por encima de la ropa.', points:5, type:'Nivel 3', mode:'both' },
            { id:144, deckId:'intimidad', level:'Intimidad', title:'Cintura y cadera', desc:'Acaricia la cintura y las caderas de tu pareja por encima de la ropa durante 20 segundos.', points:5, type:'Nivel 3', mode:'both' },
            { id:145, deckId:'intimidad', level:'Intimidad', title:'Guía mi caricia', desc:'Guía la mano de tu pareja hacia una zona íntima que quieras que acaricie, por encima o debajo de la ropa, según elijan.', points:5, type:'Nivel 3', mode:'both' },
            { id:146, deckId:'intimidad', level:'Intimidad', title:'Beso prolongado', desc:'Bésense y acaríciense por encima de la ropa durante 30 segundos.', points:5, type:'Nivel 3', mode:'both' },
            { id:147, deckId:'intimidad', level:'Intimidad', title:'Acaricia y provoca', desc:'Quien roba la carta acaricia pecho, abdomen o muslos de su pareja durante 20 segundos, por encima de la ropa.', points:5, type:'Nivel 3', mode:'both' },
            { id:148, deckId:'intimidad', level:'Intimidad', title:'Beso donde quieras', desc:'Tu pareja elige una zona erógena cómoda y recibe un beso breve.', points:5, type:'Nivel 3', mode:'both' },
            { id:149, deckId:'intimidad', level:'Intimidad', title:'Susurro al oído', desc:'Susúrrale a tu pareja una fantasía y acompáñala con una caricia lenta en el cuello.', points:5, type:'Nivel 3', mode:'both' },
            { id:150, deckId:'intimidad', level:'Intimidad', title:'Dedos por el torso', desc:'Desliza las yemas de los dedos por el torso de tu pareja hasta la cintura, sobre la ropa.', points:5, type:'Nivel 3', mode:'both' },
            { id:151, deckId:'intimidad', level:'Intimidad', title:'Caricia bajo la ropa', desc:'Acaricia con la mano una zona íntima de tu pareja bajo la ropa durante 15 segundos; quien recibe elige la zona.', points:5, type:'Nivel 3', mode:'both' },
            { id:152, deckId:'intimidad', level:'Intimidad', title:'Objeto suave', desc:'Con una tela o pluma suave, acaricia cuello, pecho o muslos de tu pareja durante 20 segundos.', points:5, type:'Nivel 3', mode:'both' },
            { id:153, deckId:'intimidad', level:'Intimidad', title:'Marca de besos', desc:'Deja tres besos en las zonas erógenas que elija tu pareja, sin usar la voz.', points:5, type:'Nivel 3', mode:'both' },
            { id:154, deckId:'intimidad', level:'Intimidad', title:'Manos inquietas', desc:'Durante 20 segundos, exploren con las manos el cuerpo de su pareja por encima de la ropa.', points:5, type:'Nivel 3', mode:'both' },
            { id:155, deckId:'intimidad', level:'Intimidad', title:'Beso en el pecho', desc:'Quien roba la carta besa el pecho o el torso de su pareja donde indique, por encima de la ropa.', points:5, type:'Nivel 3', mode:'both' },
            { id:156, deckId:'intimidad', level:'Intimidad', title:'Elige la caricia', desc:'Quien recibe elige entre cuello, pecho, abdomen o muslos; su pareja acaricia esa zona durante 20 segundos.', points:5, type:'Nivel 3', mode:'both' },
            { id:157, deckId:'intimidad', level:'Intimidad', title:'Reto oral sugerido', desc:'Si ambos lo desean, quien roba la carta da una caricia oral íntima breve a su pareja; también vale un beso en otra zona erógena.', points:5, type:'Nivel 3', mode:'both' },
            { id:158, deckId:'intimidad', level:'Intimidad', title:'Una mano, dos zonas', desc:'Acaricia dos zonas erógenas que elija tu pareja durante 10 segundos cada una.', points:5, type:'Nivel 3', mode:'both' },
            { id:159, deckId:'intimidad', level:'Intimidad', title:'Pégate y acaricia', desc:'Acércate a tu pareja y acaricia su cintura y muslos por encima de la ropa durante 20 segundos.', points:5, type:'Nivel 3', mode:'both' },
            { id:160, deckId:'intimidad', level:'Intimidad', title:'Intercambio express', desc:'En modo doble, intercambien parejas por 30 segundos para compartir caricias por encima de la ropa en zonas que cada quien elija.', points:5, type:'Nivel 3', mode:'grupo' },

            { id:169, deckId:'intimidad', level:'Intimidad', title:'Cambio de pareja: caricias', desc:'En modo doble, cambien de pareja durante 30 segundos y acaricien cuello, brazos o cintura por encima de la ropa.', points:5, type:'Nivel 3', mode:'grupo' },
            { id:170, deckId:'intimidad', level:'Intimidad', title:'Beso cruzado', desc:'En modo doble, cada quien comparte con alguien de la otra pareja un beso breve en la zona que elijan.', points:5, type:'Nivel 3', mode:'grupo' },
            { id:171, deckId:'intimidad', level:'Intimidad', title:'Manos compartidas', desc:'En modo doble, cada persona acaricia por encima de la ropa una zona elegida por su pareja de intercambio durante 20 segundos.', points:5, type:'Nivel 3', mode:'grupo' },
            { id:172, deckId:'intimidad', level:'Intimidad', title:'Intercambio de besos y caricias', desc:'En modo doble, cambien de pareja por 30 segundos para besarse o acariciarse en zonas acordadas.', points:5, type:'Nivel 3', mode:'grupo' },
            { id:173, deckId:'intimidad', level:'Intimidad', title:'Masaje cruzado', desc:'En modo doble, cada integrante da a alguien de la otra pareja un masaje breve en hombros o espalda.', points:5, type:'Nivel 3', mode:'grupo' },
            { id:174, deckId:'intimidad', level:'Intimidad', title:'Acérquense por turnos', desc:'En modo doble, cada pareja elige a quién acercarse para un beso y una caricia breve por encima de la ropa.', points:5, type:'Nivel 3', mode:'grupo' },

            // Comodines propios de cada mazo
            { id:201, deckId:'coqueteo', level:'Comodines', title:'Repite cualquier carta', desc:'Elige una carta ya jugada y repítanla.', points:0, type:'Comodín', mode:'both' },
            { id:202, deckId:'coqueteo', level:'Comodines', title:'Intercambio de roles', desc:'Intercambien los roles de quien propone y quien realiza la acción.', points:0, type:'Comodín', mode:'both' },
            { id:203, deckId:'sensaciones', level:'Comodines', title:'Elige cualquier carta', desc:'Elige cualquier carta disponible de este mazo.', points:0, type:'Comodín', mode:'both' },
            { id:204, deckId:'sensaciones', level:'Comodines', title:'Misma sensación', desc:'Ambos realizan la misma acción al mismo tiempo.', points:0, type:'Comodín', mode:'both' },
            { id:205, deckId:'sensaciones', level:'Comodines', title:'Roba otra y decide', desc:'Roba otra carta y decide cuál de las dos hacer.', points:0, type:'Comodín', mode:'both' },
            { id:206, deckId:'intimidad', level:'Comodines', title:'Dos cartas, una elección', desc:'Roba dos cartas de este mazo y elige una.', points:0, type:'Comodín', mode:'both' },
            { id:207, deckId:'intimidad', level:'Comodines', title:'Intercambien el turno', desc:'Cede el turno a tu pareja.', points:0, type:'Comodín', mode:'both' },
            { id:208, deckId:'intimidad', level:'Comodines', title:'Salto compartido', desc:'Ambos pueden saltar una carta sin penalización.', points:0, type:'Comodín', mode:'both' }
        ];
        const legacyDeckIds = {
            coqueteo: new Set(),
            sensaciones: new Set([11, 13, 14, 15, 16]),
            intimidad: new Set([17, 18, 19, 20, 23])
        };
        const levelLabels = { coqueteo: 'Nivel 1 · Coqueteo', sensaciones: 'Nivel 2 · Sensaciones', intimidad: 'Nivel 3 · Intimidad' };
        const deck = [
            ...legacyDeck.filter(card => card.type !== 'Comodín' && Object.entries(legacyDeckIds).some(([, ids]) => ids.has(card.id)))
                .map(card => {
                    const deckId = Object.entries(legacyDeckIds).find(([, ids]) => ids.has(card.id))[0];
                    return { ...card, deckId, level: levelLabels[deckId] };
                }),
            ...suppliedDeckCards.map(card => ({ ...card, level: card.type === 'Comodín' ? card.level : levelLabels[card.deckId] }))
        ];
        function cardsForMode(mode) { return deck.filter(card => card.mode === 'both' || !card.mode || card.mode === mode); }
        function cardDescriptionForMode(card) {
            const canonicalCard = deck.find(item => Number(item.id) === Number(card.id) && (!item.deckId || !card.deckId || item.deckId === card.deckId));
            if (gameMode.value === 'grupo') return card.groupDesc || canonicalCard?.groupDesc || card.desc || canonicalCard?.desc || '';
            return card.desc || canonicalCard?.desc || '';
        }
        const gameMode = document.getElementById('gameMode');
        try { gameMode.value = localStorage.getItem('chispa_mode') || 'pareja'; } catch {}
        let activeDeck = cardsForMode(gameMode.value);
        let TOTAL_CARDS = activeDeck.filter(c => c.type !== "Comodín").length;

        function freshGameData(mode = gameMode.value || 'pareja') {
            return {
                deckVersion: 5,
                gameMode: mode,
                availableCards: [...cardsForMode(mode)],
                scores: {},
                history: [],
                currentCard: null,
                wildcardUsage: {}
            };
        }

        let gameState = freshGameData();
        let presences = {};
        let localPlayerName = localStorage.getItem('fuegoCruzado_localPlayer') || "";

        // ============================================================
        // Referencias DOM
        // ============================================================
        const drawBtn = document.getElementById('drawBtn');
        const roulettePanel = document.getElementById('roulettePanel');
        const rouletteWheel = document.getElementById('rouletteWheel');
        const rouletteOptionTitle = document.getElementById('rouletteOptionTitle');
        const drawHint = document.getElementById('drawHint');
        document.querySelectorAll('[data-tab-target]').forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.tabTarget;
                document.querySelectorAll('[data-tab-target]').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
                document.querySelectorAll('.app-tab-panel').forEach(panel => panel.classList.toggle('hidden', panel.id !== targetId));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        let roomReady = false;
        let rouletteActive = false;
        drawBtn.disabled = true;
        const actionButtonsContainer = document.getElementById('actionButtonsContainer');
        const successBtn = document.getElementById('successBtn');
        const failBtn = document.getElementById('failBtn');
        const successPointsVal = document.getElementById('successPointsVal');
        const cardContainer = document.getElementById('cardContainer');
        const cardLevel = document.getElementById('cardLevel');
        const cardTitle = document.getElementById('cardTitle');
        const cardDescription = document.getElementById('cardDescription');
        const cardDrawnBy = document.getElementById('cardDrawnBy');
        const cardPoints = document.getElementById('cardPoints');
        const cardType = document.getElementById('cardType');
        const scoreDisplay = document.getElementById('scoreDisplay');
        const cardsLeft = document.getElementById('cardsLeft');
        const deckProgressBar = document.getElementById('deckProgressBar');
        const deckProgressLabel = document.getElementById('deckProgressLabel');
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            const code = document.getElementById('roomCodeInput').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
            if (code.length !== 12) { showToast('Ingresa el código completo de 12 caracteres.', 'error'); return; }
            localStorage.setItem('chispa_room', code);
            const url = new URL(location.href); url.searchParams.set('sala', code); location.href = url.toString();
        });
        document.getElementById('createRoomBtn').addEventListener('click', async () => {
            let code = roomCode;
            if (roomCode === 'PUBLICA') code = Math.random().toString(36).slice(2, 8).toUpperCase();
            localStorage.setItem('chispa_room', code);
            document.getElementById('roomCodeInput').value = code;
            roomLabel.textContent = `Sala: ${code}`;
            const inviteUrl = new URL(location.href);
            inviteUrl.searchParams.set('sala', code);
            try { await navigator.clipboard.writeText(code); showToast('Código copiado. Compártelo con la otra pareja para que entre desde su app.', 'success'); }
            catch { prompt('Comparte este código con la otra pareja:', code); }
            if (code !== roomCode) location.href = inviteUrl.toString();
        });
        const resetBtn = document.getElementById('resetBtn');
        const wildcardBtn = document.getElementById('wildcardBtn');

        const playerNameInput = document.getElementById('playerNameInput');
        const savePlayerBtn = document.getElementById('savePlayerBtn');
        const currentPlayerDisplay = document.getElementById('currentPlayerDisplay');

        const scoreTable = document.getElementById('scoreTable');
        const activePlayersList = document.getElementById('activePlayersList');
        const wildcardPlayersList = document.getElementById('wildcardPlayersList');

        const historyBtn = document.getElementById('historyBtn');
        const historyModal = document.getElementById('historyModal');
        const closeHistoryBtn = document.getElementById('closeHistoryBtn');
        const closeHistoryFooter = document.getElementById('closeHistoryFooter');
        const historyListContainer = document.getElementById('historyListContainer');

        const rulesBtn = document.getElementById('rulesBtn');
        const rulesModal = document.getElementById('rulesModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const closeModalFooter = document.getElementById('closeModalFooter');

        const viewDeckBtn = document.getElementById('viewDeckBtn');
        const deckModal = document.getElementById('deckModal');
        const closeDeckBtn = document.getElementById('closeDeckBtn');
        const closeDeckFooter = document.getElementById('closeDeckFooter');
        const deckLevelSelect = document.getElementById('deckLevelSelect');
        const deckListSummary = document.getElementById('deckListSummary');
        const deckIllustration = document.getElementById('deckIllustration');
        const cardArt = document.getElementById('cardArt');
        const deckListContainer = document.getElementById('deckListContainer');

        // ============================================================
        // Utilidades UI
        // ============================================================
        function showToast(message, kind = 'info') {
            const colors = {
                info: 'bg-slate-800 border-slate-700 text-slate-100',
                success: 'bg-emerald-900/90 border-emerald-700 text-emerald-100',
                error: 'bg-rose-900/90 border-rose-700 text-rose-100'
            };
            const toast = document.createElement('div');
            toast.className = `pointer-events-auto ${colors[kind]} border text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg max-w-sm text-center transition-opacity duration-300`;
            toast.textContent = message;
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 2600);
        }

        function renderList(container, items, emptyMessageHtml, templateFn) {
            if (!items || items.length === 0) {
                container.innerHTML = emptyMessageHtml;
                return;
            }
            container.innerHTML = items.map(templateFn).join('');
        }

        function badgeColorFor(type) {
            switch (type) {
                case "Nivel 1": return "bg-emerald-950 text-emerald-400 border border-emerald-800";
                case "Nivel 2": return "bg-amber-950 text-amber-400 border border-amber-800";
                case "Nivel 3": return "bg-rose-950 text-rose-400 border border-rose-800";
                case "Comodín": return "bg-sky-950 text-sky-400 border border-sky-800";
                default: return "bg-slate-800 text-slate-300";
            }
        }

        function deckIllustrationMarkup(deckId, instance) {
            const motifs = {
                coqueteo: '<path d="M183 55c14-11 25-12 37-2 12-10 23-9 37 2-14 10-25 13-37 3-12 10-23 7-37-3Z" fill="none" stroke="#edc978" stroke-width="2.2"/><path d="M190 55h60M197 62c8 5 16 6 23 2 7 4 15 3 23-2" fill="none" stroke="#b8794d" stroke-width="1.2"/>',
                sensaciones: '<path d="M168 68c20 0 27-7 36-19 3-4 8-2 7 3l-4 12 19-20c4-4 9 0 6 4l-12 17 18-14c4-3 8 2 4 6l-15 14h-39c-9 0-15 2-20 5M272 68c-20 0-27-7-36-19-3-4-8-2-7 3l4 12-19-20c-4-4-9 0-6 4l12 17-18-14c-4-3-8 2-4 6l15 14h39c9 0 15 2 20 5" fill="none" stroke="#edc978" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M220 48v8m-4-4h8" stroke="#fff0c0" stroke-width="1.4"/>',
                intimidad: '<path d="M220 76c-9-10-35-25-35-39 0-12 15-17 24-7l11 11 11-11c9-10 24-5 24 7 0 14-26 29-35 39Z" fill="none" stroke="#edc978" stroke-width="2"/><path d="M190 38c16 0 21 7 30 18 9-11 14-18 30-18M194 70c12-9 20-13 26-14 6 1 14 5 26 14" fill="none" stroke="#b8794d" stroke-width="1.2"/>'
            };
            const uid = `chispa-${instance}-${deckId}`;
            return `<svg viewBox="0 0 440 110" role="img" aria-label="Ilustración ${deckId}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#482333"/><stop offset=".55" stop-color="#21151e"/><stop offset="1" stop-color="#121015"/></linearGradient><radialGradient id="${uid}-glow"><stop stop-color="#c28a50" stop-opacity=".3"/><stop offset="1" stop-color="#c28a50" stop-opacity="0"/></radialGradient></defs><rect width="440" height="110" rx="16" fill="url(#${uid}-bg)"/><ellipse cx="220" cy="55" rx="125" ry="75" fill="url(#${uid}-glow)"/><rect x="8" y="8" width="424" height="94" rx="12" fill="none" stroke="#b98a52" stroke-opacity=".4"/><path d="M28 55h103m178 0h103" stroke="#c3975a" stroke-opacity=".45"/><circle cx="220" cy="55" r="38" fill="#160f16" fill-opacity=".42" stroke="#b98a52" stroke-opacity=".46"/><path d="M220 13v8M220 89v8M28 55h8m368 0h8" stroke="#edc978" stroke-opacity=".8"/><path d="M220 44l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#edc978" opacity=".75"/>${motifs[deckId] || motifs.coqueteo}<circle cx="54" cy="32" r="1.5" fill="#f0d798"/><circle cx="386" cy="78" r="1.5" fill="#f0d798"/><circle cx="375" cy="30" r="1" fill="#f0d798"/><circle cx="64" cy="80" r="1" fill="#f0d798"/></svg>`;
        }

        function populateDeckModal() {
            const levelNames = {
                coqueteo: 'Nivel 1 · Coqueteo',
                sensaciones: 'Nivel 2 · Sensaciones',
                intimidad: 'Nivel 3 · Intimidad'
            };
            Array.from(deckLevelSelect.options).forEach(option => {
                const cards = activeDeck.filter(card => card.deckId === option.value);
                const challenges = cards.filter(card => card.type !== 'Comodín').length;
                const wildcards = cards.length - challenges;
                option.textContent = `${levelNames[option.value]} · ${challenges} retos${wildcards ? ` + ${wildcards} comodines` : ''}`;
            });
            const selectedDeckId = deckLevelSelect.value || 'coqueteo';
            deckIllustration.innerHTML = deckIllustrationMarkup(selectedDeckId, 'catalog');
            const selectedCards = activeDeck
                .filter(card => card.deckId === selectedDeckId)
                .sort((a, b) => Number(a.id) - Number(b.id));
            const challengeCount = selectedCards.filter(card => card.type !== 'Comodín').length;
            const wildcardCount = selectedCards.length - challengeCount;
            deckListSummary.textContent = `${levelNames[selectedDeckId]} · ${challengeCount} retos${wildcardCount ? ` · ${wildcardCount} comodines` : ''}`;
            renderList(deckListContainer, selectedCards, '<p class="text-center text-slate-500 py-6">Este nivel no tiene cartas disponibles en el modo actual.</p>', (card) => `
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-white text-xs">${card.id}. ${card.title}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColorFor(card.type)}">${card.type === 'Comodín' ? card.level : `${deckLabels[card.deckId]} · ${card.type}`}</span>
                    </div>
                    <p class="text-slate-300 text-[11px] leading-relaxed">${cardDescriptionForMode(card)}</p>
                    <span class="text-[10px] text-rose-400 font-semibold">Valor: ${card.points} pts</span>
                </div>
            `);
        }
        populateDeckModal();
        deckLevelSelect.addEventListener('change', populateDeckModal);

        function getCurrentCardPoints(card) {
            if (!card || card.type === "Comodín") return 0;
            return card.points;
        }

        // ============================================================
        // Sincronización con Firebase
        // ============================================================
        function listFromFirebase(value) { return Array.isArray(value) ? value : Object.values(value || {}); }

        function migrateLegacyGameData(legacyStates, previousSharedState = null) {
            const mode = previousSharedState?.gameMode || 'pareja';
            const base = freshGameData(mode);
            const states = [...legacyStates];
            if (previousSharedState) states.push([null, previousSharedState]);

            const availableByDeck = new Map();
            const knownTitlesByDeck = new Map();
            const currentCards = [];
            const scores = {};
            const wildcardUsage = {};
            const history = [];

            for (const [sourceDeckId, state] of states) {
                if (!state) continue;
                const availableCards = listFromFirebase(state.availableCards);
                for (const card of availableCards) {
                    const deckId = card.deckId || sourceDeckId || 'coqueteo';
                    if (!availableByDeck.has(deckId)) availableByDeck.set(deckId, new Set());
                    availableByDeck.get(deckId).add(Number(card.id));
                }
                for (const item of listFromFirebase(state.history)) {
                    const deckId = item.deckId || sourceDeckId || 'coqueteo';
                    if (!knownTitlesByDeck.has(deckId)) knownTitlesByDeck.set(deckId, new Set());
                    knownTitlesByDeck.get(deckId).add(item.title);
                    history.push({ ...item, deckId });
                }
                if (state.currentCard) currentCards.push({ ...state.currentCard, deckId: state.currentCard.deckId || sourceDeckId || 'coqueteo' });
                Object.entries(state.scores || {}).forEach(([name, points]) => { scores[name] = (scores[name] || 0) + Number(points || 0); });
                Object.entries(state.wildcardUsage || {}).forEach(([name, count]) => { wildcardUsage[name] = Math.min(LIMITE_COMODINES, (wildcardUsage[name] || 0) + Number(count || 0)); });
            }

            const currentCard = currentCards[0] || null;
            const availableCards = base.availableCards.filter(card => {
                const deckId = card.deckId || 'coqueteo';
                const savedAvailable = availableByDeck.get(deckId);
                const wasAvailable = savedAvailable?.has(Number(card.id));
                const appearedInHistory = knownTitlesByDeck.get(deckId)?.has(card.title) || false;
                const isCurrent = currentCard && Number(currentCard.id) === Number(card.id) && (currentCard.deckId || deckId) === deckId;
                const wasKnown = wasAvailable || appearedInHistory || isCurrent;
                return !wasKnown || wasAvailable || isCurrent;
            });

            return { ...base, availableCards, scores, history, currentCard, wildcardUsage };
        }

        async function prepareSharedGameState(previousSharedState = null) {
            const legacyStates = await Promise.all(Object.entries(legacyGameRefs).map(async ([deckId, ref]) => [deckId, (await ref.once('value')).val()]));
            const migrated = migrateLegacyGameData(legacyStates, previousSharedState);
            await gameRef.transaction(current => current?.deckVersion >= 5 ? current : migrated);
        }

        authReady.then(async (credential) => {
            await memberRef.child(credential.user.uid).set(true);
            roomReady = true;
            drawBtn.disabled = false;
            const initialState = (await gameRef.once('value')).val();
            if (!initialState || Number(initialState.deckVersion || 0) < 5) await prepareSharedGameState(initialState);
            gameRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && Number(data.deckVersion || 0) >= 5) {
                    gameMode.value = data.gameMode || 'pareja';
                    localStorage.setItem('chispa_mode', gameMode.value);
                    activeDeck = cardsForMode(gameMode.value);
                    TOTAL_CARDS = activeDeck.filter(card => card.type !== 'Comodín').length;
                    gameState = {
                        availableCards: listFromFirebase(data.availableCards),
                        scores: data.scores || {},
                        history: listFromFirebase(data.history),
                        currentCard: data.currentCard || null,
                        wildcardUsage: data.wildcardUsage || {}
                    };
                    renderUI();
                } else {
                    gameRef.set(freshGameData()).catch(handleFirebaseError);
                }
            }, handleFirebaseError);
            presenceRef.on('value', (snapshot) => {
                presences = snapshot.val() || {};
                renderPresences();
            }, handleFirebaseError);
        }).catch((error) => {
            console.error('No se pudo autenticar o entrar a la sala:', error);
            showToast('No se pudo conectar. Revisa la autenticación anónima y las reglas de Firebase.', 'error');
        });

        function handleFirebaseError(error) {
            console.error('Firebase error:', error);
            showToast('Problema de conexión con la nube. Reintentando...', 'error');
        }

        function updateGameState(mutateFn) {
            if (!roomReady) {
                showToast('Conectando a la sala. Espera un momento.', 'error');
                return;
            }
            gameRef.transaction((current) => {
                const base = current || freshGameData();
                return mutateFn(base);
            }, (error, committed) => {
                if (error) {
                    console.error('Transacción fallida:', error);
                    showToast('No se pudo sincronizar la acción, probá de nuevo.', 'error');
                } else if (!committed) {
                    showToast('Otro jugador actuó al mismo tiempo, reintentá.', 'error');
                }
            });
        }

        setInterval(() => {
            if (roomReady && localPlayerName) {
                const myPresenceRef = presenceRef.child(auth.currentUser.uid);
                myPresenceRef.set({ name: localPlayerName, ts: Date.now() }).catch(handleFirebaseError);
                myPresenceRef.onDisconnect().remove();
            }
        }, 5000);

        // ============================================================
        // Render
        // ============================================================
        function renderPresences() {
            const now = Date.now();
            const activeEntries = Object.entries(presences)
                .map(([uid, presence]) => [presence?.name || uid, typeof presence === 'number' ? presence : presence?.ts])
                .filter(([, ts]) => Number.isFinite(ts) && now - ts < 15000);

            renderList(
                activePlayersList,
                activeEntries,
                `<span class="text-slate-500 italic">Nadie conectado activamente</span>`,
                ([name]) => `
                    <span class="bg-slate-950 border border-slate-800 px-2 py-1 rounded-md text-slate-200 flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ${name}
                    </span>
                `
            );
        }

        function renderUI() {
            const played = TOTAL_CARDS - gameState.availableCards.filter(c => c.type !== "Comodín").length;
            cardsLeft.textContent = gameState.availableCards.length;
            deckProgressBar.style.width = `${Math.min(100, (played / TOTAL_CARDS) * 100)}%`;
            deckProgressLabel.textContent = `${played} de ${TOTAL_CARDS} jugadas`;

            const scores = gameState.scores || {};
            const wildcardUsage = gameState.wildcardUsage || {};
            const totalGeneral = Object.values(scores).reduce((a, b) => a + b, 0);
            scoreDisplay.textContent = totalGeneral + " pts";

            const allPlayers = Object.keys(scores);
            renderList(
                wildcardPlayersList,
                allPlayers,
                `<span class="text-[10px] text-slate-500 italic">Esperando jugadores...</span>`,
                (playerName) => {
                    const usados = wildcardUsage[playerName] || 0;
                    const restantes = Math.max(0, LIMITE_COMODINES - usados);
                    const isDepleted = restantes === 0;
                    return `
                        <div class="wildcard-badge ${isDepleted ? 'depleted' : ''}">
                            <span><strong>${playerName}</strong></span>
                            <span>⭐ ${restantes}/${LIMITE_COMODINES}</span>
                        </div>
                    `;
                }
            );

            const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
            renderList(
                scoreTable,
                sortedScores,
                `<p class="text-center text-slate-500 italic">No hay puntos registrados aún</p>`,
                ([player, pts]) => `
                    <div class="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                        <span class="font-bold text-slate-200">${player}</span>
                        <span class="text-rose-400 font-extrabold">${pts} pts</span>
                    </div>
                `
            );

            const history = gameState.history || [];
            renderList(
                historyListContainer,
                history,
                `<p class="text-center text-slate-500 italic py-4">No hay cartas jugadas en el historial todavía.</p>`,
                (item) => {
                    const statusBadge = item.status === "Cumplida"
                        ? `<span class="text-emerald-400 font-bold">✅ +${item.points} pts</span>`
                        : `<span class="text-rose-400 font-bold">❌ Omitida</span>`;
                    return `
                        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
                            <div class="flex justify-between text-[11px]">
                                <span class="font-bold text-rose-500">${item.player}</span>
                                ${statusBadge}
                            </div>
                            <p class="font-semibold text-white">${item.title}</p>
                            <span class="text-[10px] text-slate-500">${item.level}</span>
                        </div>
                    `;
                }
            );

            if (gameState.currentCard) {
                drawHint.classList.add('hidden');
                rouletteActive = false;
                roulettePanel.classList.add('hidden');
                rouletteWheel.classList.remove('spinning');
                const card = gameState.currentCard;
                cardArt.innerHTML = deckIllustrationMarkup(card.deckId || 'coqueteo', 'card');
                cardLevel.textContent = card.level;
                cardTitle.textContent = card.title;
                cardDescription.textContent = cardDescriptionForMode(card);

                // Aplicar o quitar efecto visual excitante si es Nivel 3
                if (card.type === "Nivel 3") {
                    cardContainer.classList.add('card-high-voltage');
                } else {
                    cardContainer.classList.remove('card-high-voltage');
                }

                if (card.drawnBy) {
                    cardDrawnBy.textContent = `Robada por ${card.drawnBy}`;
                    cardDrawnBy.classList.remove('hidden');
                } else {
                    cardDrawnBy.classList.add('hidden');
                }

                const finalPoints = getCurrentCardPoints(card);
                cardPoints.textContent = card.type === "Comodín" ? "Puntos: Pase Libre" : `Puntos en juego: +${finalPoints}`;
                cardType.textContent = card.type;

                successPointsVal.textContent = finalPoints;
                actionButtonsContainer.classList.remove('hidden');
                drawBtn.disabled = true;
            } else {
                drawHint.classList.toggle('hidden', rouletteActive);
                cardArt.innerHTML = deckIllustrationMarkup('coqueteo', 'card');
                cardContainer.classList.remove('card-high-voltage');
                if (rouletteActive) return;
                cardLevel.textContent = 'Presiona "Robar Carta"';
                cardTitle.textContent = "¡Listo para comenzar!";
                cardDescription.textContent = "Saca tu primera carta para encender la chispa grupal.";
                cardDrawnBy.classList.add('hidden');
                cardPoints.textContent = "Puntos: --";
                cardType.textContent = "Mazo Principal";
                actionButtonsContainer.classList.add('hidden');
                drawBtn.disabled = false;
            }
        }

        // ============================================================
        // Eventos
        // ============================================================
        savePlayerBtn.addEventListener('click', () => {
            const name = playerNameInput.value.trim();
            if (!name) {
                showToast("Por favor ingresa un nombre válido.", 'error');
                return;
            }
            localPlayerName = name;
            localStorage.setItem('fuegoCruzado_localPlayer', name);
            currentPlayerDisplay.textContent = `Jugador en este teléfono: ${name}`;

            updateGameState((state) => {
                if (!state.scores) state.scores = {};
                if (!(name in state.scores)) state.scores[name] = 0;
                return state;
            });

            showToast(`¡Nombre guardado: ${name}!`, 'success');
        });

        gameMode.addEventListener('change', () => {
            if (gameState.currentCard) {
                showToast("Resuelve o pasa la carta actual antes de cambiar de modo.", 'error');
                gameMode.value = localStorage.getItem('chispa_mode') || 'pareja';
                return;
            }
            localStorage.setItem('chispa_mode', gameMode.value);
            activeDeck = cardsForMode(gameMode.value);
            TOTAL_CARDS = activeDeck.filter(c => c.type !== "Comodín").length;
            updateGameState(state => {
                state.gameMode = gameMode.value;
                state.availableCards = [...activeDeck];
                state.currentCard = null;
                return state;
            });
            drawBtn.disabled = false;
            renderUI();
            populateDeckModal();
        });

        drawBtn.addEventListener('click', () => {
            if (!localPlayerName) {
                showToast("Configura tu nombre en este teléfono primero.", 'error');
                playerNameInput.focus();
                return;
            }
            if (gameState.currentCard) {
                showToast("Ya hay una carta activa, resolvela primero.", 'error');
                return;
            }
            if (gameState.availableCards.length === 0) {
                showToast("Se agotaron las cartas. Reiniciá el mazo.", 'error');
                return;
            }

            const available = [...gameState.availableCards];
            const availableDeckIds = [...new Set(available.map(card => card.deckId || 'coqueteo'))];
            const chosenDeckId = availableDeckIds[Math.floor(Math.random() * availableDeckIds.length)];
            const options = available.filter(card => (card.deckId || 'coqueteo') === chosenDeckId);
            const winner = options[Math.floor(Math.random() * options.length)];
            rouletteActive = true;
            drawHint.classList.add('hidden');
            drawBtn.disabled = true;
            roulettePanel.classList.remove('hidden');
            rouletteWheel.classList.remove('spinning');
            rouletteOptionTitle.textContent = `${deckLabels[chosenDeckId] || 'Comodines'} · preparando cartas`;
            void rouletteWheel.offsetWidth;
            rouletteWheel.classList.add('spinning');
            const spinStartedAt = performance.now();
            let spinTimer;
            const spinDuration = 4400;
            const tick = () => {
                const progress = Math.min(1, (performance.now() - spinStartedAt) / spinDuration);
                const option = options[Math.floor(Math.random() * options.length)];
                rouletteOptionTitle.textContent = `${deckLabels[option.deckId] || 'Comodines'} · ${option.title}`;
                if (progress < 1) spinTimer = setTimeout(tick, 42 + 420 * Math.pow(progress, 2.8));
            };
            tick();
            setTimeout(() => {
                clearTimeout(spinTimer);
                rouletteWheel.classList.remove('spinning');
                rouletteOptionTitle.textContent = `${deckLabels[winner.deckId] || 'Comodines'} · ${winner.title}`;
                setTimeout(() => {
                    roulettePanel.classList.add('hidden');
                    rouletteActive = false;
                    updateGameState((state) => {
                        if (!state.availableCards || state.availableCards.length === 0 || state.currentCard) return state;
                        const cards = [...state.availableCards];
                        let selectedIndex = cards.findIndex(card => card.id === winner.id);
                        if (selectedIndex < 0) selectedIndex = Math.floor(Math.random() * cards.length);
                        const drawn = cards.splice(selectedIndex, 1)[0];
                        state.availableCards = cards;
                        state.currentCard = { ...drawn, drawnBy: localPlayerName };
                        return state;
                    });
                }, 450);
            }, 2800);
        });

        successBtn.addEventListener('click', () => {
            if (!gameState.currentCard || !localPlayerName) return;
            const card = gameState.currentCard;
            const finalPoints = getCurrentCardPoints(card);

            updateGameState((state) => {
                if (!state.scores) state.scores = {};
                if (!(localPlayerName in state.scores)) state.scores[localPlayerName] = 0;
                state.scores[localPlayerName] += finalPoints;

                if (!state.history) state.history = [];
                state.history = [{
                    player: localPlayerName,
                    title: card.title,
                    level: card.level,
                    points: finalPoints,
                    status: "Cumplida"
                }, ...state.history];

                state.currentCard = null;
                return state;
            });

            showToast("¡Reto registrado con éxito!", 'success');
        });

        failBtn.addEventListener('click', () => {
            if (!gameState.currentCard || !localPlayerName) return;
            const card = gameState.currentCard;

            updateGameState((state) => {
                if (!state.history) state.history = [];
                state.history = [{
                    player: localPlayerName,
                    title: card.title,
                    level: card.level,
                    points: 0,
                    status: "Omitida"
                }, ...state.history];

                state.currentCard = null;
                return state;
            });

            showToast("Reto omitido y descartado.", 'info');
        });

        wildcardBtn.addEventListener('click', () => {
            if (!localPlayerName) {
                showToast("Configura tu nombre en este teléfono primero.", 'error');
                return;
            }

            let limitReached = false;

            updateGameState((state) => {
                if (!state.scores) state.scores = {};
                if (!state.wildcardUsage) state.wildcardUsage = {};

                const usosActuales = state.wildcardUsage[localPlayerName] || 0;
                if (usosActuales >= LIMITE_COMODINES) {
                    limitReached = true;
                    return state;
                }

                state.wildcardUsage[localPlayerName] = usosActuales + 1;

                if (!(localPlayerName in state.scores)) state.scores[localPlayerName] = 0;
                state.scores[localPlayerName] += 2;

                if (!state.history) state.history = [];

                const activeCard = state.currentCard;
                const isEscapableCard = activeCard && (activeCard.type === "Nivel 2" || activeCard.type === "Nivel 3");

                state.history = [{
                    player: localPlayerName,
                    title: isEscapableCard ? `Comodín de Escape (canceló: ${activeCard.title})` : "Comodín de Escape",
                    level: "Comodines",
                    points: 2,
                    status: "Cumplida"
                }, ...state.history];

                if (isEscapableCard) {
                    state.currentCard = null;
                }
                return state;
            });

            setTimeout(() => {
                if (limitReached) {
                    showToast("Ya utilizaste tus comodines en esta partida.", 'error');
                } else {
                    showToast("¡Comodín utilizado con éxito (+2 puntos)!", 'success');
                }
            }, 50);
        });

        resetBtn.addEventListener('click', () => {
            if (!confirm("¿Reiniciar toda la partida y el mazo en la nube para todos?")) return;
            gameRef.set(freshGameData())
                .then(() => showToast("Partida reiniciada para todos.", 'info'))
                .catch(handleFirebaseError);
        });

        rulesBtn.addEventListener('click', () => rulesModal.classList.remove('hidden'));
        closeModalBtn.addEventListener('click', () => rulesModal.classList.add('hidden'));
        closeModalFooter.addEventListener('click', () => rulesModal.classList.add('hidden'));

        historyBtn.addEventListener('click', () => historyModal.classList.remove('hidden'));
        closeHistoryBtn.addEventListener('click', () => historyModal.classList.add('hidden'));
        closeHistoryFooter.addEventListener('click', () => historyModal.classList.add('hidden'));

        viewDeckBtn.addEventListener('click', () => deckModal.classList.remove('hidden'));
        closeDeckBtn.addEventListener('click', () => deckModal.classList.add('hidden'));
        closeDeckFooter.addEventListener('click', () => deckModal.classList.add('hidden'));
    
