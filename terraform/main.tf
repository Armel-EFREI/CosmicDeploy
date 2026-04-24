# ============================================================
# Étape 6 — Section terraform + required_providers
# ============================================================
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# ============================================================
# Étape 6 — Provider block (étape 9 du cours)
# Connexion via az login (no credentials in code)
# ============================================================
provider "azurerm" {
  features {}
  subscription_id             = "5a182994-b6b2-4c73-b007-3c20a5549b3b"
  skip_provider_registration  = true
}

# ============================================================
# Étape 7 — Resource group (étape 5 du cours)
# ============================================================
resource "azurerm_resource_group" "main" {
  name     = "rg-cosmicdeploy-terraform"
  location = "West Europe"
}

# ============================================================
# Étape 11 — IP publique
# ============================================================
resource "azurerm_public_ip" "main" {
  name                = "pip-cosmicdeploy"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  allocation_method   = "Static"
  sku                 = "Standard"
}

# ============================================================
# Étape 12 — Réseau virtuel + sous-réseau + NIC
# ============================================================
resource "azurerm_virtual_network" "main" {
  name                = "vnet-cosmicdeploy"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "main" {
  name                 = "subnet-cosmicdeploy"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_network_security_group" "main" {
  name                = "nsg-cosmicdeploy"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  security_rule {
    name                       = "allow-ssh"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-http"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # NodePort K8s (cosmicdeploy Service) — accès à l'app via l'IP publique
  security_rule {
    name                       = "allow-k8s-nodeport"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "30080"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_interface" "main" {
  name                = "nic-cosmicdeploy"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.main.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.main.id
  }
}

resource "azurerm_network_interface_security_group_association" "main" {
  network_interface_id      = azurerm_network_interface.main.id
  network_security_group_id = azurerm_network_security_group.main.id
}

# ============================================================
# Étape 13 — Clé SSH publique (conservé pour l'exercice)
# ============================================================
resource "azurerm_ssh_public_key" "main" {
  name                = "sshkey-cosmicdeploy"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  public_key          = file("~/.ssh/id_rsa_azure.pub")
}

# ============================================================
# Étape 14 — VM Ubuntu (authentification par mot de passe)
# ============================================================
resource "azurerm_linux_virtual_machine" "main" {
  name                            = "vm-cosmicdeploy"
  resource_group_name             = azurerm_resource_group.main.name
  location                        = azurerm_resource_group.main.location
  size                            = "Standard_B1s"
  admin_username                  = "azureuser"
  admin_password                  = var.admin_password
  disable_password_authentication = false

  network_interface_ids = [
    azurerm_network_interface.main.id,
  ]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }
}

# ============================================================
# Étape 17 — Outputs
# ============================================================
output "public_ip" {
  description = "Adresse IP publique de la VM"
  value       = azurerm_public_ip.main.ip_address
}

output "ssh_command" {
  description = "Commande SSH pour se connecter à la VM"
  value       = "ssh azureuser@${azurerm_public_ip.main.ip_address}"
}

output "resource_group" {
  description = "Nom du resource group créé"
  value       = azurerm_resource_group.main.name
}
