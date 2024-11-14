const App = {
  // URL de l'API pour récupérer la liste des musiques
  URL: "http://localhost/api/v1/", // Remplacer par l'URL de ton API

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
    artist = (await this.getArtists()).find((artist) => artist.id == id);
    return artist;
  },

  async getAlbumByid(id) {
    album = (await this.getAlbums()).find((album) => album.id == id);
    return album;
  },

  // Les sélecteurs importants du DOM
  _dom: {
    musiquesWrapper: document.querySelector("#musiques-wrapper .musiques"),
    musiquesCount: document.querySelector("#musiques-count"),
    pagesNumbers: document.querySelector(".choose-page.m-1"), // Sélecteur pour les boutons
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
    this._dom.musiquesWrapper.innerHTML = `<p>Chargement des musiques...</p>`;

    // Charger le nombre de pages via l'API si c'est la première page
    // const totalPages = await this.getNumberPages();
    // Charger les musiques via l'API pour la page demandée
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

    // Générer le HTML des boutons de pagination si c'est la première page
    // if (page === 1) {
    //   this.generatePaginationButtons(totalPages);
    // }

    // Générer le HTML pour chaque musique
    const html = musiquesWithDetails
      .map(
        (musique) => `
      <div class="musique p-2 border mb-2" data-id="${musique.id}">
        <h3>${musique.titre}</h3>
        <p class="musique-artist">Artiste: ${musique.artisteNom}</p>
        <p class="musique-album">Album: ${musique.albumTitre}</p>
        <div class="musique--operations mt-1 bg-white text-center border-top">
            <button class="btn btn-link operation" data-operation="edit"><i class="bi bi-pencil"></i>éditer</button>
            <button class="btn btn-link operation" data-operation="delete"><i class="bi bi-trash3"></i> effacer</button>
        </div>
        <div class="edit-form" style="display:none;">
            <input type="text" class="edit-title" placeholder="Titre" />
            <input type="text" class="edit-artist" placeholder="Artiste" />
            <input type="text" class="edit-album" placeholder="Album" />
            <button class="update-btn">Mettre à jour</button>
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
            artist: musiqueDiv
              .querySelector(".musique-artist")
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

    // Afficher le formulaire d'édition
    editForm.style.display = "block"; // Afficher le formulaire

    // Remplir le formulaire avec les données actuelles
    musiqueDiv.querySelector(".edit-title").value = musiqueData.title;
    musiqueDiv.querySelector(".edit-artist").value = musiqueData.artist;
    musiqueDiv.querySelector(".edit-album").value = musiqueData.album;

    // Lorsque l'utilisateur soumet le formulaire, effectuer la mise à jour
    editForm.querySelector(".update-btn").onclick = async () => {
      try {
        // Récupérer les nouvelles données du formulaire
        const updatedData = {
          titre: musiqueDiv.querySelector(".edit-title").value,
          artist: musiqueDiv.querySelector(".edit-artist").value,
          album: musiqueDiv.querySelector(".edit-album").value,
        };
        console.log(updatedData);

        const response = await fetch(`${this.URL}musiques/${musiqueId}`, {
          method: "PATCH", // Utilisez PUT pour mettre à jour
          headers: {
            "Content-Type": "application/json", // Indique que nous envoyons des données JSON
          },
          body: JSON.stringify(updatedData), // Utiliser les nouvelles données
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la modification de la musique.");
        }

        const updatedMusique = await response.json(); // Obtenir la musique mise à jour

        // Mettre à jour le DOM avec les nouvelles données
        musiqueDiv.querySelector("h3").textContent = updatedMusique.title;
        musiqueDiv.querySelector(
          ".musique-artist"
        ).textContent = `Artiste: ${updatedMusique.artist}`;
        musiqueDiv.querySelector(
          ".musique-album"
        ).textContent = `Album: ${updatedMusique.album}`;

        // Masquer le formulaire après la mise à jour
        editForm.style.display = "none";

        this.HELPERS.log(`Musique avec ID: ${musiqueId} modifiée avec succès.`);
      } catch (error) {
        console.error("Erreur lors de la modification de la musique:", error);
      }
    };
  },
  handleSubmit: async function (event) {
    event.preventDefault();

    // Récupérer les valeurs du formulaire
    const newMusicData = {
      titre: document.getElementById("musicTitle").value,
      artist: document.getElementById("musicArtist").value,
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
};

// Initialiser l'application quand le DOM est prêt
document.addEventListener("DOMContentLoaded", () => App.init());
