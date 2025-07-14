import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Expediente, CreateExpedienteRequest } from '../../models/expediente.model';
import { ExpedienteService } from '../../services/expediente.service';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario, TipoUsuario } from '../../models/usuario.model';

@Component({
  selector: 'app-expedientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './expedientes.component.html',
  styleUrls: ['./expedientes.component.css']
})
export class ExpedientesComponent implements OnInit {
  expedientes: Expediente[] = [];
  expedienteForm: FormGroup;
  editingExpediente: Expediente | null = null;
  showForm = false;
  loading = false;
  pacientes: Usuario[] = [];
  errorMessage = '';
  successMessage = '';

  constructor(
    private expedienteService: ExpedienteService,
    private usuarioService: UsuarioService,
    private fb: FormBuilder
  ) {
    this.expedienteForm = this.fb.group({
      paciente_id: ['', [Validators.required]],
      antecedentes: [''],
      historial_clinico: [''],
      seguro: ['']
    });
  }

  ngOnInit(): void {
    this.loadExpedientes();
    this.loadPacientes();
  }

  loadExpedientes(): void {
    this.loading = true;
    this.expedienteService.getExpedientes().subscribe({
      next: (expedientes) => {
        this.expedientes = expedientes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading expedientes:', error);
        this.errorMessage = 'Error al cargar expedientes';
        this.loading = false;
      }
    });
  }

  loadPacientes(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        // Corregir el filtro usando el enum TipoUsuario
        this.pacientes = usuarios.filter(u => u.tipo === TipoUsuario.PACIENTE);
      },
      error: (error) => {
        console.error('Error loading pacientes:', error);
        this.errorMessage = 'Error al cargar pacientes';
      }
    });
  }

  openCreateForm(): void {
    this.editingExpediente = null;
    this.expedienteForm.reset();
    this.showForm = true;
    this.clearMessages();
  }

  openEditForm(expediente: Expediente): void {
    this.editingExpediente = expediente;
    this.expedienteForm.patchValue({
      paciente_id: expediente.paciente_id,
      antecedentes: expediente.antecedentes,
      historial_clinico: expediente.historial_clinico,
      seguro: expediente.seguro
    });
    this.showForm = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingExpediente = null;
    this.expedienteForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.expedienteForm.valid) {
      const formValue = this.expedienteForm.value;
      
      // Asegurar que paciente_id sea un número
      const expedienteData: CreateExpedienteRequest = {
        paciente_id: parseInt(formValue.paciente_id, 10),
        antecedentes: formValue.antecedentes || null,
        historial_clinico: formValue.historial_clinico || null,
        seguro: formValue.seguro || null
      };
      
      // Validar que paciente_id sea un número válido
      if (isNaN(expedienteData.paciente_id)) {
        this.errorMessage = 'Debe seleccionar un paciente válido';
        return;
      }
      
      if (this.editingExpediente) {
        this.updateExpediente(this.editingExpediente.id_expediente!, expedienteData);
      } else {
        this.createExpediente(expedienteData);
      }
    } else {
      this.errorMessage = 'Por favor complete todos los campos requeridos';
    }
  }

  createExpediente(expedienteData: CreateExpedienteRequest): void {
    this.expedienteService.createExpediente(expedienteData).subscribe({
      next: (expediente) => {
        this.expedientes.push(expediente);
        this.successMessage = 'Expediente creado exitosamente';
        this.closeForm();
      },
      error: (error) => {
        console.error('Error creating expediente:', error);
        this.errorMessage = error.error?.error || 'Error al crear expediente';
      }
    });
  }

  updateExpediente(id: number, expedienteData: CreateExpedienteRequest): void {
    this.expedienteService.updateExpediente(id, expedienteData).subscribe({
      next: (expediente) => {
        const index = this.expedientes.findIndex(e => e.id_expediente === id);
        if (index !== -1) {
          this.expedientes[index] = expediente;
        }
        this.successMessage = 'Expediente actualizado exitosamente';
        this.closeForm();
      },
      error: (error) => {
        console.error('Error updating expediente:', error);
        this.errorMessage = error.error?.error || 'Error al actualizar expediente';
      }
    });
  }

  deleteExpediente(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este expediente?')) {
      this.expedienteService.deleteExpediente(id).subscribe({
        next: () => {
          this.expedientes = this.expedientes.filter(e => e.id_expediente !== id);
          this.successMessage = 'Expediente eliminado exitosamente';
        },
        error: (error) => {
          console.error('Error deleting expediente:', error);
          this.errorMessage = error.error?.error || 'Error al eliminar expediente';
        }
      });
    }
  }

  getPacienteNombre(pacienteId: number): string {
    const paciente = this.pacientes.find(p => p.id_usuario === pacienteId);
    return paciente ? paciente.nombre : 'N/A';
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}