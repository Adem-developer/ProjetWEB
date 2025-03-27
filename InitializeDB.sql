-------------------------- Début de la création des tables --------------------------
-- Créer la base de données
CREATE DATABASE FoodyDB ENCODING 'UTF8';
CREATE USER admin1 WITH ENCRYPTED PASSWORD 'admin1';
ALTER USER admin1 WITH SUPERUSER;
\c foodydb;

-- Création des types ENUM (Assurez-vous que cette ligne est exécutée avant la création des tables)
CREATE TYPE statut_commande AS ENUM ('EN_COURS', 'PAYE', 'ANNULE'); 
CREATE TYPE mode_paiement AS ENUM ('CB', 'ESPECES', 'CHEQUE'); 

-- Table : Clients
CREATE TABLE Clients (
    ID_Client SERIAL PRIMARY KEY,
    Nom VARCHAR(50) NOT NULL,
    Prenom VARCHAR(50),
    Contact VARCHAR(100) UNIQUE NOT NULL,
    Points_Fidelite INT DEFAULT 0
);

-- Table : Employes
CREATE TABLE Employes (
    ID_Employe SERIAL PRIMARY KEY,
    Nom VARCHAR(50) NOT NULL,
    Prenom VARCHAR(50),
    Poste VARCHAR(50),
    Horaire TIMESTAMP
);

-- Table : Inventaire
CREATE TABLE Inventaire (
    ID_Produit SERIAL PRIMARY KEY,
    Nom_Produit VARCHAR(100) NOT NULL,
    Quantite_Disponible INT DEFAULT 0,
    Seuil_Critique INT DEFAULT 5
);

-- Table : Menus
CREATE TABLE Menus (
    ID_Plat SERIAL PRIMARY KEY,
    Nom_Plat VARCHAR(100) NOT NULL,
    Description TEXT,
    Prix DECIMAL(10, 2) NOT NULL,
    Disponibilite BOOLEAN DEFAULT TRUE
);

-- Table : Commandes
CREATE TABLE Commandes (
    ID_Commande SERIAL PRIMARY KEY,
    ID_Client INT NOT NULL,
    ID_Employe INT,
    Date_Commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Statut statut_commande DEFAULT 'EN_COURS',
    Total_Commande DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (ID_Client) REFERENCES Clients(ID_Client),
    FOREIGN KEY (ID_Employe) REFERENCES Employes(ID_Employe)
);

-- Table : Details_Commande
CREATE TABLE Details_Commande (
    ID_Commande INT NOT NULL,
    ID_Plat INT NOT NULL,
    Quantite INT NOT NULL,
    PRIMARY KEY (ID_Commande, ID_Plat),
    FOREIGN KEY (ID_Commande) REFERENCES Commandes(ID_Commande) ON DELETE CASCADE,
    FOREIGN KEY (ID_Plat) REFERENCES Menus(ID_Plat) ON DELETE CASCADE
);

-- Table : Paiements
CREATE TABLE Paiements (
    ID_Paiement SERIAL PRIMARY KEY,
    ID_Commande INT NOT NULL,
    Date_Paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Mode_Paiement mode_paiement NOT NULL,
    FOREIGN KEY (ID_Commande) REFERENCES Commandes(ID_Commande)
);



-- Table Véhicule
CREATE TABLE Vehicule (
    ID_Vehicule SERIAL PRIMARY KEY,  -- Utilisation de SERIAL pour un ID auto-incrémenté
    Marque VARCHAR(50),
    Modele VARCHAR(50),
    Immatriculation VARCHAR(20),
    Capacite DECIMAL(10, 2),
    Disponibilite BOOLEAN DEFAULT TRUE
);

-- Table Livreur
CREATE TABLE Livreur (
    ID_Livreur SERIAL PRIMARY KEY,  -- Utilisation de SERIAL pour un ID auto-incrémenté
    ID_Employe INT,
    ID_Vehicule INT,
    Zone_Livraison TEXT,
    FOREIGN KEY (ID_Employe) REFERENCES Employes(ID_Employe),
    FOREIGN KEY (ID_Vehicule) REFERENCES Vehicule(ID_Vehicule)
);

CREATE TABLE Logs_Activites (
    ID_Log SERIAL PRIMARY KEY,               -- Utilisation de SERIAL au lieu de AUTO_INCREMENT
    ID_Employe INT NOT NULL,                 -- Employé ayant généré le log
    ID_Commande INT DEFAULT NULL,            -- Commande concernée (optionnel)
    ActionDescr VARCHAR(255) NOT NULL,            -- Description de l'action
    Date_Action TIMESTAMP NOT NULL DEFAULT NOW(), -- Date et heure de l'action
    Details TEXT DEFAULT NULL,               -- Détails supplémentaires

    -- Clés étrangères
    CONSTRAINT FK_Logs_Employe FOREIGN KEY (ID_Employe) REFERENCES Employes(ID_Employe) ON DELETE CASCADE,
    CONSTRAINT FK_Logs_Commande FOREIGN KEY (ID_Commande) REFERENCES Commandes(ID_Commande) ON DELETE SET NULL);

-------------------------- Fin de la création des tables --------------------------


-------------------------- Début de la création des triggers --------------------------

CREATE OR REPLACE FUNCTION check_menu_disponibilite()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Quantite_Disponible <= NEW.Seuil_Critique THEN
        UPDATE Menus
        SET Disponibilite = FALSE
        WHERE ID_Plat = NEW.ID_Produit;
    ELSE
        UPDATE Menus
        SET Disponibilite = TRUE
        WHERE ID_Plat = NEW.ID_Produit;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_menu_disponibilite
AFTER UPDATE ON Inventaire
FOR EACH ROW
EXECUTE FUNCTION check_menu_disponibilite();


-- #############################################
-- ## Trigger 2 : Historisation des actions ##
-- #############################################
--
-- **Description** :
-- Enregistre chaque insertion ou modification d'une commande dans la table
-- `Logs_Activites` avec les details de l'action.
--
-- **Tables concernees** : Commandes, Logs_Activites

CREATE OR REPLACE FUNCTION log_employee_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Logs_Activites (ID_Employe, ID_Commande, actiondescr, Date_Action)
    VALUES (NEW.ID_Employe, NEW.ID_Commande, TG_OP, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_command_action
AFTER INSERT OR UPDATE ON Commandes
FOR EACH ROW
EXECUTE FUNCTION log_employee_action();


-- #############################################
-- ## Trigger 3 : Verification paiement valide ##
-- #############################################
--
-- **Description** :
-- Verifie qu'une commande existe avant d'ajouter un paiement.
-- Si la commande n'existe pas, une exception est levee.
--
-- **Tables concernees** : Paiements, Commandes

CREATE OR REPLACE FUNCTION verify_commande_exists()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Commandes WHERE ID_Commande = NEW.ID_Commande) THEN
        RAISE EXCEPTION 'La commande associee n''existe pas. Paiement annule.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_verify_commande_paiement
BEFORE INSERT ON Paiements
FOR EACH ROW
EXECUTE FUNCTION verify_commande_exists();




-- ###########################################
-- ## Trigger 4 : Mise a jour points client ##
-- ###########################################
--
-- **Description** :
-- Met a jour les points de fidelite des clients lorsqu'un paiement est effectue.
-- Les points sont calcules comme 1 point pour 10 unites du total de la commande.
--
-- **Tables concernees** : Paiements, Clients, Commandes

CREATE OR REPLACE FUNCTION update_points_fidelite()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Clients
    SET Points_Fidelite = Points_Fidelite + (SELECT Total_Commande / 10
                                             FROM Commandes
                                             WHERE ID_Commande = NEW.ID_Commande)
    WHERE ID_Client = (SELECT ID_Client 
                       FROM Commandes 
                       WHERE ID_Commande = NEW.ID_Commande);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_points_fidelite
AFTER INSERT ON Paiements
FOR EACH ROW
EXECUTE FUNCTION update_points_fidelite();


-- #############################################
-- ## Trigger 5 : Verification des menus ##
-- #############################################
--
-- **Description** :
-- Lors de l'ajout d'un menu dans `Details_Commande`, verifie que le menu est disponible.
-- Si le menu n'est pas disponible, l'insertion est annulee.
--
-- **Tables concernees** : Details_Commande, Menus

CREATE OR REPLACE FUNCTION check_menu_disponibilite_details()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM Menus
        WHERE ID_Plat = NEW.ID_Plat AND Disponibilite = TRUE
    ) THEN
        RAISE EXCEPTION 'Le menu n''est pas disponible.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_menu_disponibilite
BEFORE INSERT ON Details_Commande
FOR EACH ROW
EXECUTE FUNCTION check_menu_disponibilite_details();


-- #############################################
-- ## Trigger 6 : Verification quantite initiale ##
-- #############################################
--
-- **Description** :
-- Verifie qu'un produit ajoute dans l'inventaire ne dispose pas d'une quantite
-- initiale inferieure au seuil critique.
--
-- **Tables concernees** : Inventaire

CREATE OR REPLACE FUNCTION check_quantite_initiale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Quantite_Disponible < NEW.Seuil_Critique THEN
        RAISE EXCEPTION 'La quantite initiale ne peut pas etre inferieure au seuil critique.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_quantite_inventaire
BEFORE INSERT ON Inventaire
FOR EACH ROW
EXECUTE FUNCTION check_quantite_initiale();


-- ##############################################
-- ## Trigger 7 : Historique des changements ##
-- ##############################################
--
-- **Description** :
-- Lorsqu'un employe change de poste, un log est ajoute dans la table `Logs_Activites`.
--
-- **Tables concernees** : Employes, Logs_Activites

CREATE OR REPLACE FUNCTION log_poste_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Logs_Activites (ID_Employe, actiondescr, date_action, details)
    VALUES (OLD.ID_Employe, 'Modification', NOW(), 'Changement de poste de ' || OLD.Poste || ' a ' || NEW.Poste);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_poste_change
AFTER UPDATE OF Poste ON Employes
FOR EACH ROW
EXECUTE FUNCTION log_poste_change();


-- ############################################
-- ## Trigger 8 : Verification disponibilite vehicule ##
-- ############################################
--
-- **Description** :
-- Lors de l'affectation d'un vehicule a un livreur, verifie que le vehicule est disponible.
-- Si le vehicule n'est pas disponible, l'insertion ou la mise a jour est annulee.
--
-- **Tables concernees** : Vehicule, Livreur

CREATE OR REPLACE FUNCTION check_vehicule_disponibilite()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM Vehicule
        WHERE ID_Vehicule = NEW.ID_Vehicule AND Disponibilite = TRUE
    ) THEN
        RAISE EXCEPTION 'Le vehicule assigne n''est pas disponible.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_vehicule_disponibilite
BEFORE INSERT OR UPDATE ON Livreur
FOR EACH ROW
EXECUTE FUNCTION check_vehicule_disponibilite();


-- ############################################
-- ## Trigger 9 : Mise à jour de la disponibilité ##
-- ############################################
--
-- **Description** :
-- Lorsqu'un véhicule est assigné à un livreur, sa disponibilité
-- est mise à `FALSE` dans la table `Vehicule`.

CREATE OR REPLACE FUNCTION update_vehicule_disponibilite()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour la disponibilité du véhicule à FALSE
    UPDATE Vehicule
    SET Disponibilite = FALSE
    WHERE ID_Vehicule = NEW.ID_Vehicule;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger déclenché après une insertion ou une mise à jour dans la table Livreur
CREATE TRIGGER trigger_update_vehicule_disponibilite
AFTER INSERT OR UPDATE OF ID_Vehicule ON Livreur
FOR EACH ROW
EXECUTE FUNCTION update_vehicule_disponibilite();


-- ############################################
-- ## Trigger 10 : Historique affectation livreur ##
-- ############################################
--
-- **Description** :
-- Enregistre dans les logs lorsqu'un livreur est affecte a un nouveau vehicule.
--
-- **Tables concernees** : Livreur, Logs_Activites

CREATE OR REPLACE FUNCTION log_livreur_affectation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Logs_Activites (ID_Employe, actiondescr, Date_Action)
    VALUES (NEW.ID_Employe, 'Affectation Vehicule', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_livreur_affectation
AFTER UPDATE OF ID_Vehicule ON Livreur
FOR EACH ROW
EXECUTE FUNCTION log_livreur_affectation();


-- ############################################
-- ## Trigger 11 : Historique affectation livreur ##
-- ############################################
-- **Description** :
-- Actualise la colonne total_commande

-- Créer la fonction qui met à jour Total_Commande
CREATE OR REPLACE FUNCTION update_total_commande() 
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour Total_Commande à chaque modification dans Details_Commande
    UPDATE Commandes
    SET Total_Commande = (
        SELECT SUM(d.Quantite * m.Prix)
        FROM Details_Commande d
        JOIN Menus m ON d.ID_Plat = m.ID_Plat
        WHERE d.ID_Commande = Commandes.ID_Commande
    )
    WHERE ID_Commande = NEW.ID_Commande OR ID_Commande = OLD.ID_Commande;
    RETURN NEW;  -- Retourner la nouvelle ligne
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour Total_Commande lors de l'insertion, de la mise à jour ou de la suppression dans Details_Commande
CREATE TRIGGER trigger_update_total_commande
AFTER INSERT OR UPDATE OR DELETE ON Details_Commande
FOR EACH ROW
EXECUTE FUNCTION update_total_commande();

-------------------------- Fin de la création des triggers --------------------------


-------------------------- Début de l'insertion des données --------------------------

-- =======================================
-- Insertion des données dans la base
-- =======================================

-- Table : Clients
INSERT INTO Clients (Nom, Prenom, Contact, Points_Fidelite)
VALUES 
    ('Dupont', 'Jean', 'jean.dupont@gmail.com', 10),
    ('Martin', 'Sophie', 'sophie.martin@gmail.com', 15),
    ('Durand', 'Paul', 'paul.durand@gmail.com', 8),
    ('Bernard', 'Claire', 'claire.bernard@gmail.com', 5),
    ('Moreau', 'Alice', 'alice.moreau@gmail.com', 20),
    ('Lemoine', 'Julie', 'julie.lemoine@gmail.com', 25),
    ('Petit', 'Olivier', 'olivier.petit@gmail.com', 30),
    ('Benoit', 'Caroline', 'caroline.benoit@gmail.com', 12),
    ('Simon', 'Luc', 'luc.simon@gmail.com', 5),
    ('Tremblay', 'Anne', 'anne.tremblay@gmail.com', 18);

-- Table : Employes
INSERT INTO Employes (Nom, Prenom, Poste, Horaire)
VALUES 
    ('Lemoine', 'Pierre', 'Serveur', '2024-11-18 09:00:00'),
    ('Rousseau', 'Marie', 'Caissier', '2024-11-18 08:30:00'),
    ('Noir', 'Julien', 'Manager', '2024-11-18 08:00:00'),
    ('Morel', 'Emma', 'Serveur', '2024-11-18 12:00:00'),
    ('Girard', 'Thomas', 'Caissier', '2024-11-18 10:00:00'),
    ('Lopez', 'Laura', 'Chef de Cuisine', '2024-11-18 08:00:00'),
    ('Garcia', 'Antoine', 'Serveur', '2024-11-18 12:30:00');

-- Table : Inventaire
INSERT INTO Inventaire (Nom_Produit, Quantite_Disponible, Seuil_Critique)
VALUES 
    ('Tomates', 100, 10),
    ('Fromage', 50, 5),
    ('Poulet', 30, 5),
    ('Pâtes', 70, 15),
    ('Pain', 80, 10),
    ('Champignons', 50, 10),
    ('Crème Fraîche', 40, 10),
    ('Viande de Bœuf', 20, 5),
    ('Lait', 30, 8),
    ('Oignons', 60, 12);

-- Table : Menus
INSERT INTO Menus (Nom_Plat, Description, Prix, Disponibilite)
VALUES 
    ('Pizza Margherita', 'Pizza classique avec tomates et fromage', 10.50, TRUE),
    ('Pâtes Carbonara', 'Pâtes avec sauce carbonara', 12.00, TRUE),
    ('Poulet Rôti', 'Poulet rôti avec accompagnement', 15.00, TRUE),
    ('Salade César', 'Salade avec poulet et sauce césar', 9.00, TRUE),
    ('Soupe de légumes', 'Soupe maison avec légumes frais', 7.50, TRUE),
    ('Burger Maison', 'Burger avec viande de bœuf et légumes frais', 13.00, TRUE),
    ('Lasagnes', 'Lasagnes à la bolognaise maison', 14.50, TRUE),
    ('Tiramisu', 'Dessert italien classique', 6.50, TRUE),
    ('Sandwich Club', 'Sandwich avec poulet, tomate et salade', 8.50, TRUE),
    ('Quiche Lorraine', 'Quiche avec lardons et fromage', 9.00, TRUE);

-- Table : Commandes
INSERT INTO Commandes (ID_Client, ID_Employe, Date_Commande, Statut, Total_Commande)
VALUES 
    (1, 1, '2024-11-18 12:30:00', 'EN_COURS', 22.50),
    (2, 2, '2024-11-18 13:00:00', 'PAYE', 18.00),
    (3, 1, '2024-11-18 13:15:00', 'PAYE', 30.00),
    (4, 2, '2024-11-18 14:00:00', 'ANNULE', 0.00),
    (5, 4, '2024-11-18 12:15:00', 'PAYE', 21.50),
    (3, 1, '2024-11-18 13:30:00', 'EN_COURS', 35.00),
    (2, 2, '2024-11-18 14:00:00', 'ANNULE', 0.00),
    (6, 3, '2024-11-18 14:30:00', 'PAYE', 19.00),
    (7, 2, '2024-11-18 15:00:00', 'PAYE', 11.50);

-- Table : Détails_Commande
INSERT INTO Details_Commande (ID_Commande, ID_Plat, Quantite)
VALUES 
    (1, 1, 2), -- 2x Pizza Margherita
    (1, 4, 1), -- 1x Salade César
    (2, 3, 1), -- 1x Poulet Rôti
    (3, 2, 2), -- 2x Pâtes Carbonara
    (3, 5, 1), -- 1x Soupe de légumes
    (4, 3, 1), -- 1x Lasagnes
    (4, 5, 2), -- 2x Quiche Lorraine
    (5, 6, 1), -- 1x Tiramisu
    (5, 7, 1), -- 1x Sandwich Club
    (6, 2, 1), -- 1x Pâtes Carbonara
    (7, 1, 1), -- 1x Pizza Margherita
    (7, 3, 2); -- 2x Lasagnes

-- Table : Paiements
INSERT INTO Paiements (ID_Commande, Date_Paiement, Mode_Paiement)
VALUES 
    (2, '2024-11-18 13:10:00', 'CB'),
    (3, '2024-11-18 13:30:00', 'ESPECES'),
    (4, '2024-11-18 14:40:00', 'CB'),
    (5, '2024-11-18 14:45:00', 'ESPECES'),
    (6, '2024-11-18 15:15:00', 'CHEQUE');


-- AJOUTS DES TROIS DATAS CI DESSOUS

-- Table : Vehicule
INSERT INTO Vehicule (Marque, Modele, Immatriculation, Capacite, Disponibilite)
VALUES
    ('Peugeot', 'Partner', 'AB-123-CD', 500, TRUE),
    ('Renault', 'Kangoo', 'EF-456-GH', 600, TRUE),
    ('Citroën', 'Berlingo', 'IJ-789-KL', 400, TRUE),
    ('Ford', 'Transit', 'MN-012-OP', 800, TRUE),
    ('Mercedes', 'Sprinter', 'QR-345-ST', 1000, TRUE);


-- Table : Livreur
INSERT INTO Livreur (ID_Employe, ID_Vehicule, Zone_Livraison)
VALUES
    (1, 1, 'Centre-ville'),
    (3, 2, 'Banlieue nord'),
    (4, 3, 'Quartiers est'),
    (5, 4, 'Banlieue sud'),
    (7, 5, 'Périphérie ouest');


-- Insertion des données dans Logs_Activites
INSERT INTO Logs_Activites (ID_Employe, ID_Commande, actiondescr, Details)
VALUES
    (1, 1, 'Création de commande', 'Commande #1 créée par Jean Dupont'),
    (3, NULL, 'Modification de menu', 'Prix du plat "Pizza Margherita" mis à jour'),
    (2, 5, 'Annulation de commande', 'Commande #5 annulée par le client'),
    (4, 7, 'Paiement enregistré', 'Paiement CB enregistré pour commande #7'),
    (6, NULL, 'Mise à jour de stock', 'Quantité de "Tomates" ajustée dans l’inventaire'),
    (7, 2, 'Livraison terminée', 'Commande #2 livrée avec succès.');

-------------------------- Fin de l'insertion des données --------------------------
