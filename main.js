const App = {
  // URL de l'API pour récupérer la liste des musiques
  URL: "https://amiotflorian.alwaysdata.net/api/v1/", // Remplacer par l'URL de ton API

  // Fonction pour obtenir toutes les musiques pour une page donnée
  async getMusiques() {
    try {
      const response = await fetch(`${this.URL}musiques`);
      const data = await response.json();
      return data; // Vérifie que "data" contient bien une propriété "data" et qu'elle est une liste
    } catch (error) {
      console.error("Erreur lors de la récupération des musiques:", error);
      return []; // Retourner un tableau vide en cas d'erreur pour éviter des erreurs sur undefined
    }
  },
  async getAlbums() {
    try {
      const response = await fetch(`${this.URL}albums`);
      const data = await response.json();
      return data; // Vérifie que "data" contient bien une propriété "data" et qu'elle est une liste
    } catch (error) {
      console.error("Erreur lors de la récupération des musiques:", error);
      return []; // Retourner un tableau vide en cas d'erreur pour éviter des erreurs sur undefined
    }
  },
  async getArtists() {
    try {
      const response = await fetch(`${this.URL}artistes`);
      const data = await response.json();
      return data; // Vérifie que "data" contient bien une propriété "data" et qu'elle est une liste
    } catch (error) {
      console.error("Erreur lors de la récupération des musiques:", error);
      return []; // Retourner un tableau vide en cas d'erreur pour éviter des erreurs sur undefined
    }
  },

  // Fonction pour obtenir le nombre total de pages
  getNumberPages: async function () {
    try {
      const response = await fetch(this.URL); // Requête API pour la première page
      const data = await response.json(); // Convertir la réponse en JSON
      return data.total_pages; // Le nombre de pages est dans data.total_pages
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du nombre de pages:",
        error
      );
    }
  },

  async getArtistByid(id) {
    artiste = (await this.getArtists()).find((artiste) => artiste.id == id);
    return artiste;
  },

  async getAlbumByid(id) {
    album = (await this.getAlbums()).find((album) => album.id == id);
    return album;
  },

  // Les sélecteurs importants du DOM
  _dom: {
    musiquesWrapper: document.querySelector("#musiques-wrapper .musiques"),
    musiquesCount: document.querySelector("#musiques-count"),
    pagesNumbers: document.querySelector(".chose-pages"), // Sélecteur pour les boutons
  },

  /**
   * Initialisation de l'application.
   */
  init() {
    this.HELPERS.log.call(this, "Application démarrée.");
    this.injectDatas(); // Charger les musiques et la pagination pour la première page
    document.getElementById("addMusicForm").onsubmit =
      this.handleSubmit.bind(this);

    // Ajouter un écouteur d'événements délégué pour la pagination
    this._dom.pagesNumbers.addEventListener("click", (event) =>
      this.operation(event)
    );
    this._dom.musiquesWrapper.addEventListener("click", (event) =>
      this.operation(event)
    );
  },

  /**
   * Charger et afficher les musiques.
   */
  async injectDatas() {
    // Afficher un message de chargement
    this._dom.musiquesWrapper.innerHTML = `<p id="music-loading">Chargement des musiques...</p>`;

    // Charger les musiques via l'API
    const musiques = await this.getMusiques();

    const musiquesWithDetails = await Promise.all(
      musiques.map(async (musique) => {
        // Récupérer l'artiste et l'album pour chaque musique
        const artiste = await this.getArtistByid(musique.artiste_id);
        const album = await this.getAlbumByid(musique.album_id);

        return {
          ...musique,
          artisteNom: artiste ? artiste.nom : "Inconnu", // Si l'artiste est introuvable, mettre un nom par défaut
          albumTitre: album ? album.titre : "Inconnu", // Si l'album est introuvable, mettre un titre par défaut
          artisteId: artiste ? artiste.id : null,
          albumId: album ? album.id : null,
        };
      })
    );

    // Mettre à jour le compteur de musiques
    this._dom.musiquesCount.textContent = musiques.length;

    // Si aucune musique n'a été trouvée
    if (musiques.length === 0) {
      this._dom.musiquesWrapper.innerHTML = `<p>Aucune musique trouvée.</p>`;
      return;
    }

    // Générer le HTML pour chaque musique avec des liens cliquables
    const html = musiquesWithDetails
      .map(
        (musique) => `
      <div class="musique p-2 border mb-2" data-id="${musique.id}">
        <h3>${musique.titre}</h3>
        <p class="musique-artiste">
          Artiste: <a href="#" data-artiste-id="${musique.artisteId}" onclick="App.fetchDetails('artiste', ${musique.artisteId})">${musique.artisteNom}</a>
          </p>
          <p class="musique-album">
            Album: <a href="#" data-album-id="${musique.albumId}" onclick="App.fetchDetails('album', ${musique.albumId})">${musique.albumTitre}</a>
          </p>

        <div class="musique--operations mt-1 bg-white text-center border-top">
          <button class="btn btn-link operation" data-operation="edit"><i class="bi bi-pencil"></i> Éditer</button>
          <button class="btn btn-link operation" data-operation="delete"><i class="bi bi-trash3"></i> Effacer</button>
        </div>
        <div class="edit-form" style="display:none;">
          <input type="text" class="edit-title" placeholder="Titre" />
          <input type="text" class="edit-artiste" placeholder="Artiste" />
          <input type="text" class="edit-album" placeholder="Album" />
          <button class="btn update-btn">Mettre à jour</button>
        </div>
      </div>

    `
      )
      .join("");

    // Injecter les musiques dans le DOM
    this._dom.musiquesWrapper.innerHTML = html;
  },

  /**
   * Générer les boutons de pagination.
   * @param {number} totalPages - Le nombre total de pages.
   */
  generatePaginationButtons(totalPages) {
    let buttonsHtml = "";

    for (let i = 1; i <= totalPages; i++) {
      buttonsHtml += `<button class="page-btn btn btn-primary m-1 operation" data-operation="page" data-page="${i}">Page ${i}</button>`;
    }

    // Injecter les boutons dans le DOM
    this._dom.pagesNumbers.innerHTML = buttonsHtml;
  },

  /**
   * Traiter les événements ('edit', 'delete', 'page') sur les musiques.
   * @param {Event} event - L'événement du clic.
   */
  async operation(event) {
    const target = event.target.closest(".operation");

    if (!target) {
      this.HELPERS.log("Aucune opération cliquée.");
      return; // Sortir si aucun bouton n'est trouvé
    }

    const operation = target.dataset.operation;
    const musiqueId = target.closest(".musique")
      ? target.closest(".musique").dataset.id
      : null;

    try {
      switch (operation) {
        case "page":
          const page = target.getAttribute("data-page");
          this.HELPERS.log(`Chargement de la page ${page}`);
          await this.injectDatas(page);
          return; // Sortir après avoir chargé la page

        case "edit":
          if (!musiqueId) {
            this.HELPERS.log("ID de musique introuvable pour l'édition.");
            return;
          }

          const musiqueDiv = document.querySelector(
            `.musique[data-id="${musiqueId}"]`
          );
          const musiqueData = {
            title: musiqueDiv.querySelector("h3").textContent,
            artiste: musiqueDiv
              .querySelector(".musique-artiste")
              .textContent.replace("Artiste: ", ""),
            album: musiqueDiv
              .querySelector(".musique-album")
              .textContent.replace("Album: ", ""),
          };
          await this.editMusique(musiqueId, musiqueData);
          break;

        case "delete":
          if (musiqueId) {
            this.HELPERS.log(`Suppression de la musique avec ID: ${musiqueId}`);
            await this.deleteMusique(musiqueId); // Suppression de la musique
          } else {
            this.HELPERS.log("ID de musique introuvable pour la suppression.");
          }
          break;

        default:
          this.HELPERS.log("Opération non reconnue");
      }
    } catch (error) {
      console.error("Erreur lors du traitement de l'opération:", error);
    }
  },

  async deleteMusique(musiqueId) {
    try {
      const response = await fetch(`${this.URL}musiques/${musiqueId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la musique.");
      }
      this.HELPERS.log(`Musique avec ID: ${musiqueId} supprimée avec succès.`);

      const musiqueDiv = document.querySelector(
        `.musique[data-id="${musiqueId}"]`
      );
      if (musiqueDiv) {
        musiqueDiv.remove();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la musique:", error);
    }
  },

  async editMusique(musiqueId, musiqueData) {
    const musiqueDiv = document.querySelector(
      `.musique[data-id="${musiqueId}"]`
    );
    const editForm = musiqueDiv.querySelector(".edit-form");
    const editButton = musiqueDiv.querySelector(
      `button[data-operation="edit"]`
    );

    // Vérifier si le formulaire est actuellement affiché
    const isFormOpen = editForm.style.display === "block";

    if (isFormOpen) {
      // Fermer le formulaire et rétablir le texte du bouton
      editForm.style.display = "none";
      editButton.innerHTML = '<i class="bi bi-pencil"></i> Éditer';
    } else {
      // Ouvrir le formulaire et changer le texte du bouton
      editForm.style.display = "block";
      editButton.innerHTML = '<i class="bi bi-x-circle"></i> Fermer';

      // Nettoyer les données en utilisant trim() pour enlever les espaces avant et après
      const cleanedTitle = musiqueData.title.trim();
      const cleanedArtist = musiqueData.artiste.trim();
      const cleanedAlbum = musiqueData.album.trim();

      // Remplir le formulaire avec les données actuelles
      musiqueDiv.querySelector(".edit-title").value = cleanedTitle;
      musiqueDiv.querySelector(".edit-artiste").value = cleanedArtist;
      musiqueDiv.querySelector(".edit-album").value = cleanedAlbum;

      // Assigner un événement de mise à jour pour le bouton "Mettre à jour"
      editForm.querySelector(".update-btn").onclick = async () => {
        try {
          const updatedData = {
            titre: musiqueDiv.querySelector(".edit-title").value.trim(),
            artiste: musiqueDiv.querySelector(".edit-artiste").value.trim(),
            album: musiqueDiv.querySelector(".edit-album").value.trim(),
          };

          const response = await fetch(`${this.URL}musiques/${musiqueId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedData),
          });

          if (!response.ok) {
            throw new Error("Erreur lors de la modification de la musique.");
          }

          const updatedMusique = await response.json();
          musiqueDiv.querySelector("h3").textContent = updatedData.titre;
          musiqueDiv.querySelector(
            ".musique-artiste"
          ).textContent = `Artiste: ${updatedData.artiste}`;
          musiqueDiv.querySelector(
            ".musique-album"
          ).textContent = `Album: ${updatedData.album}`;

          // Masquer le formulaire et rétablir le texte du bouton
          editForm.style.display = "none";
          editButton.innerHTML = '<i class="bi bi-pencil"></i> Éditer';

          this.HELPERS.log(
            `Musique avec ID: ${musiqueId} modifiée avec succès.`
          );
        } catch (error) {
          console.error("Erreur lors de la modification de la musique:", error);
        }
      };
    }
  },

  handleSubmit: async function (event) {
    event.preventDefault();
    const addMusicButton = document.getElementById("addMusicButton");
    const addMusicForm = document.getElementById("addMusicForm");

    // Récupérer les valeurs du formulaire
    const newMusicData = {
      titre: document.getElementById("musicTitle").value,
      artiste: document.getElementById("musicArtist").value,
      album: document.getElementById("musicAlbum").value,
      annee: document.getElementById("musicYear").value || null, // Si l'année est vide, envoyer `null`
      genre: document.getElementById("musicGenre").value || null, // Si le genre est vide, envoyer `null`
    };

    try {
      // Envoyer la requête POST pour créer une nouvelle musique
      const response = await fetch(this.URL + "musiques", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMusicData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout de la musique.");
      }

      const result = await response.json();

      // Fermer le modal et afficher une notification de succès
      this.closeModal();
      alert("Musique ajoutée avec succès!");

      // Réinitialiser le formulaire
      this.resetForm();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la musique:", error);
      alert("Une erreur s'est produite. Veuillez réessayer.");
    }
  },

  // Méthode pour fermer le modal Bootstrap
  closeModal: function () {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addMusicModal")
    );
    modal.hide();
  },

  // Méthode pour réinitialiser le formulaire
  resetForm: function () {
    document.getElementById("addMusicForm").reset();
  },

  // Méthode pour fermer le modal Bootstrap
  closeModal: function () {
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addMusicModal")
    );
    modal.hide();
  },

  // Méthode pour réinitialiser le formulaire
  resetForm: function () {
    document.getElementById("addMusicForm").reset();
  },

  // Méthodes utilitaires regroupées dans la propriété HELPERS
  HELPERS: {
    log(message) {
      console.log(`%c${message}`, "color: white; font-size: 16px");
    },
  },
  async fetchDetails(type, id) {
    const modal = document.getElementById("details-modal");
    const content = document.getElementById("details-content");

    // Afficher le modal
    modal.classList.add("show");

    // Effacer les anciens contenus
    content.innerHTML = "<p>Chargement...</p>";

    try {
      let url = ""; // URL à appeler en fonction du type
      let responseData = null;

      // Définir l'URL de l'API selon le type
      if (type === "artiste") {
        url = `${this.URL}artistes/${id}/albums-musiques`;
      } else if (type === "album") {
        url = `${this.URL}albums/${id}/musiques`;
      } else {
        throw new Error("Type inconnu");
      }

      // Effectuer la requête API
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur: ${type} non trouvé`);

      responseData = await response.json();

      // Afficher les données dans le contenu
      if (type === "artiste") {
        // Vérification de la structure de la réponse
        if (!Array.isArray(responseData) || responseData.length === 0) {
          throw new Error("Données de l'artiste introuvables");
        }

        // Extraire les données de l'artiste et de ses albums
        const albums = responseData; // Si responseData est un tableau contenant les albums
        const artisteId = albums[0]?.artiste_id || id;
        const artiste = await this.getArtistByid(artisteId);

        content.innerHTML = `
                <h3>${artiste.nom}</h3>
                <hr>
                <p>Genre: ${artiste.genre || "Non spécifié"}</p>
                <h4>Albums:</h4>
                <ul>
                    ${albums
                      .map(
                        (album) => `
                        <li>
                            <strong>${album.titre.trim()}</strong> (${
                          album.annee || "Année inconnue"
                        })
                            <ul>
                                ${album.musiques
                                  .map(
                                    (musique) =>
                                      `<li>${musique.titre.trim()}</li>`
                                  )
                                  .join("")}
                            </ul>
                        </li>
                    `
                      )
                      .join("")}
                </ul>
            `;
      } else if (type === "album") {
        // Vérification de la structure de la réponse
        if (!Array.isArray(responseData) || responseData.length === 0) {
          throw new Error("Données de l'album introuvables");
        }

        // Extraire les données du premier objet de la réponse
        const musiques = responseData; // Tableau contenant les musiques
        const albumId = musiques[0]?.album_id || id;
        const album = await this.getAlbumByid(albumId);
        const artiste = await this.getArtistByid(album.artiste_id);

        content.innerHTML = `
                <h3>${album.titre.trim()}</h3>
                <hr>
                <p>Année: ${album.annee || "Année inconnue"}</p>
                <p>Artiste: ${artiste.nom}</p>
                <h4>Chansons:</h4>
                <ul>
                    ${musiques
                      .map((musique) => `<li>${musique.titre.trim()}</li>`)
                      .join("")}
                </ul>
            `;
      }
    } catch (error) {
      content.innerHTML = `<p>Erreur lors de la récupération des informations : ${error.message}</p>`;
    }
  },
  // Fonction pour fermer le modal
  closeDetails() {
    document.getElementById("details-modal").classList.remove("show");
  },
};

// Initialiser l'application quand le DOM est prêt
document.addEventListener("DOMContentLoaded", () => App.init());
