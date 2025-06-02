document.addEventListener('DOMContentLoaded', () => {
    const albumGrid = document.getElementById('album-grid');
    const albumDetailsModal = document.createElement('div');
    albumDetailsModal.classList.add('album-details-modal');
    document.body.appendChild(albumDetailsModal);

    // Elementos para la funcionalidad de búsqueda en la página
    const searchInput = document.getElementById('search-input');
    const searchCriterionSelect = document.getElementById('search-criterion');
    const applyFilterButton = document.getElementById('apply-filter-button');
    const clearSearchButton = document.getElementById('clear-search');

    // Elementos de la barra lateral
    const navInicioLink = document.getElementById('nav-inicio-link');
    const sidebarSearchLink = document.getElementById('sidebar-search-link');
    const navYourLibraryLink = document.getElementById('nav-your-library-link');
    const navCreatePlaylistLink = document.getElementById('nav-create-playlist-link');
    const navLikedSongsLink = document.getElementById('nav-liked-songs-link');

    // Contenedores de contenido principal
    const exploreAlbumsSection = document.getElementById('explore-albums-section');
    const yourLibrarySection = document.getElementById('your-library-section');
    const createPlaylistSection = document.getElementById('create-playlist-section');
    const likedSongsSection = document.getElementById('liked-songs-section');

    // Grids para las nuevas secciones
    const libraryAlbumGrid = document.getElementById('library-album-grid');
    const likedSongsGrid = document.getElementById('liked-songs-grid');

    // Mensajes de secciones vacías
    const emptyLibraryMessage = document.getElementById('empty-library-message');
    const emptyLikedMessage = document.getElementById('empty-liked-message');

    const jsonFilePath = 'albums.json';
    let allAlbumsData = [];
    let currentFilteredAlbums = [];

    // --- Funciones de Utilidad para localStorage ---

    // Obtener álbumes de una categoría específica (biblioteca, gustados, etc.)
    function getAlbumsFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    // Guardar álbumes en una categoría específica
    function saveAlbumsToStorage(key, albums) {
        localStorage.setItem(key, JSON.stringify(albums));
    }

    // Añadir un álbum a una categoría
    function addAlbumToCollection(key, album) {
        const collection = getAlbumsFromStorage(key);
        if (!collection.some(a => a.id === album.id)) { // Evitar duplicados
            collection.push(album);
            saveAlbumsToStorage(key, collection);
            return true; // Añadido con éxito
        }
        return false; // Ya existía
    }

    // Eliminar un álbum de una categoría
    function removeAlbumFromCollection(key, albumId) {
        let collection = getAlbumsFromStorage(key);
        const initialLength = collection.length;
        collection = collection.filter(a => a.id !== albumId);
        saveAlbumsToStorage(key, collection);
        return collection.length < initialLength; // Eliminado con éxito
    }

    // Comprobar si un álbum está en una categoría
    function isAlbumInCollection(key, albumId) {
        const collection = getAlbumsFromStorage(key);
        return collection.some(album => album.id === albumId);
    }

    // --- Lógica de Interfaz de Usuario (Mostrar/Ocultar secciones) ---

    // Array de todas las secciones de contenido para gestionarlas fácilmente
    const allContentSections = [
        exploreAlbumsSection,
        yourLibrarySection,
        createPlaylistSection,
        likedSongsSection
    ];

    // Función para mostrar una sección específica y ocultar las demás
    function showSection(sectionToShow, activeLink = null) { // Acepta un enlace activo opcional
        allContentSections.forEach(section => {
            if (section === sectionToShow) {
                section.classList.remove('hidden-section');
                section.classList.add('visible-section');
            } else {
                section.classList.remove('visible-section');
                section.classList.add('hidden-section');
            }
        });

        // **CORRECCIÓN CLAVE 2: Gestionar la clase 'active' de forma más robusta**
        document.querySelectorAll('.sidebar .nav-links a, .sidebar .playlists a').forEach(link => {
            link.classList.remove('active');
        });

        if (activeLink) {
            activeLink.classList.add('active');
        } else if (sectionToShow === exploreAlbumsSection) { // Default a Inicio si no se pasa activeLink
            navInicioLink.classList.add('active');
        }


        // Actualizar la vista de las colecciones si se muestra la sección correspondiente
        if (sectionToShow === yourLibrarySection) {
            renderLibraryAlbums();
        } else if (sectionToShow === likedSongsSection) {
            renderLikedSongs();
        }
        // Desplazarse al inicio del contenido principal para una mejor UX
        document.querySelector('.main-content').scrollTop = 0;
    }

    // --- Carga y Renderizado de Álbumes ---

    function loadAlbums() {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', jsonFilePath, true);
        xhr.responseType = 'json';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const albumsData = xhr.response;
                if (albumsData) {
                    // Asignar un ID único a cada álbum si no lo tienen (útil para localStorage)
                    allAlbumsData = albumsData.map((album, index) => ({ ...album, id: album.id || `album-${index}` }));
                    currentFilteredAlbums = [...allAlbumsData];
                    renderAlbums(currentFilteredAlbums, albumGrid); // Renderiza en el grid principal
                } else {
                    console.error('Error: No se pudieron obtener los datos de los álbumes o están vacíos.');
                }
            } else {
                console.error('Error al cargar los álbumes:', xhr.status, xhr.statusText);
            }
        };

        xhr.onerror = function() {
            console.error('Error de red al intentar cargar los álbumes.');
        };

        xhr.send();
    }

    // Función de renderizado genérica para cualquier grid
    function renderAlbums(albumsToRender, targetGrid, emptyMessageElement = null) {
        targetGrid.innerHTML = '';

        if (albumsToRender.length === 0) {
            if (emptyMessageElement) {
                emptyMessageElement.style.display = 'block';
            }
            return;
        } else {
            if (emptyMessageElement) {
                emptyMessageElement.style.display = 'none';
            }
        }

        albumsToRender.forEach(album => {
            const albumCard = document.createElement('div');
            albumCard.classList.add('album-card');
            albumCard.innerHTML = `
                <img src="${album.foto}" alt="${album.titulo}">
                <h3>${album.titulo}</h3>
                <p>${album.artista}</p>
                <p>${album.año}</p>
            `;
            albumCard.addEventListener('click', () => showAlbumDetails(album));
            targetGrid.appendChild(albumCard);
        });
    }

    // --- Renderizado específico para Biblioteca y Canciones Gustadas ---
    function renderLibraryAlbums() {
        const libraryAlbums = getAlbumsFromStorage('userLibrary');
        renderAlbums(libraryAlbums, libraryAlbumGrid, emptyLibraryMessage);
    }

    function renderLikedSongs() {
        const likedAlbums = getAlbumsFromStorage('likedSongs');
        renderAlbums(likedAlbums, likedSongsGrid, emptyLikedMessage);
    }


    // --- Modal de Detalles del Álbum (actualizado con correcciones) ---
    function showAlbumDetails(album) {
        // La comprobación inicial aquí es solo para establecer el estado inicial del modal.
        // La lógica de añadir/eliminar en los botones se encargará de la actualización.
        let isInLibrary = isAlbumInCollection('userLibrary', album.id);
        let isLiked = isAlbumInCollection('likedSongs', album.id);

        albumDetailsModal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">×</span>
                <div class="modal-album-info">
                    <img src="${album.foto}" alt="${album.titulo}">
                    <h2>${album.titulo}</h2>
                    <p><strong>Artista:</strong> ${album.artista}</p>
                    <p><strong>Año:</strong> ${album.año}</p>
                    <p><strong>Género:</strong> ${album.genero}</p>
                    <p><strong>Tamaño:</strong> ${album.tamaño}</p>
                </div>
                <div class="modal-parts-list">
                    <h3>Partes / Discos</h3>
                    <ul>
                        ${album.partes.map(parte => `
                            <li>
                                <span>${parte.nombre}</span>
                                <a href="${parte.url}" target="_blank">Reproducir</a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="modal-actions">
                    <button id="add-to-library-btn" class="${isInLibrary ? 'added' : ''}">
                        ${isInLibrary ? 'Añadido a Biblioteca' : 'Añadir a Biblioteca'}
                    </button>
                    <button id="add-to-liked-btn" class="${isLiked ? 'added' : ''}">
                        ${isLiked ? 'Te gusta' : 'Me gusta'} <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        albumDetailsModal.style.display = 'flex';

        const addToLibraryBtn = document.getElementById('add-to-library-btn');
        const addToLikedBtn = document.getElementById('add-to-liked-btn');

        // **CORRECCIÓN CLAVE 1: Actualizar el estado dinámicamente dentro de los event listeners**
        addToLibraryBtn.addEventListener('click', () => {
            if (isAlbumInCollection('userLibrary', album.id)) { // Re-comprobar el estado actual
                removeAlbumFromCollection('userLibrary', album.id);
                addToLibraryBtn.textContent = 'Añadir a Biblioteca';
                addToLibraryBtn.classList.remove('added');
            } else {
                addAlbumToCollection('userLibrary', album);
                addToLibraryBtn.textContent = 'Añadido a Biblioteca';
                addToLibraryBtn.classList.add('added');
            }
            // Si la sección de la biblioteca está visible, actualiza su contenido
            if (yourLibrarySection.classList.contains('visible-section')) {
                renderLibraryAlbums();
            }
        });

        addToLikedBtn.addEventListener('click', () => {
            if (isAlbumInCollection('likedSongs', album.id)) { // Re-comprobar el estado actual
                removeAlbumFromCollection('likedSongs', album.id);
                addToLikedBtn.innerHTML = 'Me gusta <i class="fas fa-heart"></i>';
                addToLikedBtn.classList.remove('added');
            } else {
                addAlbumToCollection('likedSongs', album);
                addToLikedBtn.innerHTML = 'Te gusta <i class="fas fa-heart"></i>';
                addToLikedBtn.classList.add('added');
            }
            // Si la sección de canciones gustadas está visible, actualiza su contenido
            if (likedSongsSection.classList.contains('visible-section')) {
                renderLikedSongs();
            }
        });


        albumDetailsModal.querySelector('.close-button').onclick = () => {
            albumDetailsModal.style.display = 'none';
        };

        albumDetailsModal.onclick = (event) => {
            if (event.target === albumDetailsModal) {
                albumDetailsModal.style.display = 'none';
            }
        };
    }

    // --- Lógica de Búsqueda y Filtrado (existente) ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const criterion = searchCriterionSelect.value;

        currentFilteredAlbums = allAlbumsData.filter(album => {
            const matchesArtist = album.artista.toLowerCase().includes(searchTerm);
            const matchesGenre = album.genero.toLowerCase().includes(searchTerm);
            const matchesYear = album.año.toString().includes(searchTerm);
            const matchesTitle = album.titulo.toLowerCase().includes(searchTerm);

            if (!searchTerm) {
                return true;
            }

            if (criterion === 'all') {
                return matchesArtist || matchesGenre || matchesYear || matchesTitle;
            } else if (criterion === 'artista') {
                return matchesArtist;
            } else if (criterion === 'genero') {
                return matchesGenre;
            } else if (criterion === 'año') {
                return matchesYear;
            } else if (criterion === 'titulo') {
                return matchesTitle;
            }
            return false;
        });

        renderAlbums(currentFilteredAlbums, albumGrid);
    }

    // --- Event Listeners Globales ---

    // Event listeners para la barra de búsqueda (existentes)
    applyFilterButton.addEventListener('click', applyFilters);
    searchInput.addEventListener('input', () => {
        if (searchInput.value.length > 0) {
            clearSearchButton.style.display = 'block';
        } else {
            clearSearchButton.style.display = 'none';
        }
        // applyFilters(); // Descomenta esta línea si quieres búsqueda instantánea al escribir
    });
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            applyFilters();
        }
    });
    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchButton.style.display = 'none';
        applyFilters();
    });
    searchCriterionSelect.addEventListener('change', () => {
        applyFilters();
    });

    // Event listeners para los enlaces de la barra lateral (Actualizados)
    navInicioLink.addEventListener('click', (event) => {
        event.preventDefault();
        showSection(exploreAlbumsSection, navInicioLink); // Pasar el enlace activo
    });

    sidebarSearchLink.addEventListener('click', (event) => {
        event.preventDefault();
        showSection(exploreAlbumsSection, sidebarSearchLink); // Pasar el enlace activo
        const searchControls = document.querySelector('.search-controls');
        if (searchControls) {
            window.scrollTo({
                top: searchControls.offsetTop - 20,
                behavior: 'smooth'
            });
            searchInput.focus();
        }
    });

    navYourLibraryLink.addEventListener('click', (event) => {
        event.preventDefault();
        showSection(yourLibrarySection, navYourLibraryLink); // Pasar el enlace activo
    });

    navCreatePlaylistLink.addEventListener('click', (event) => {
        event.preventDefault();
        showSection(createPlaylistSection, navCreatePlaylistLink); // Pasar el enlace activo
    });

    navLikedSongsLink.addEventListener('click', (event) => {
        event.preventDefault();
        showSection(likedSongsSection, navLikedSongsLink); // Pasar el enlace activo
    });


    // Inicialización al cargar la página
    loadAlbums(); // Carga los álbumes para la sección de "Explorar Álbumes"
    showSection(exploreAlbumsSection, navInicioLink); // Asegura que "Explorar Álbumes" sea la sección inicial y "Inicio" esté activo
});