variable "admin_password" {
  description = "Mot de passe administrateur de la VM (min 12 caractères, majuscule + chiffre + caractère spécial)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.admin_password) >= 12
    error_message = "Le mot de passe doit faire au moins 12 caractères."
  }
}
