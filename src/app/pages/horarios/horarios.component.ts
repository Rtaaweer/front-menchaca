import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Horario, CreateHorarioRequest } from '../../models/horario.model';
import { HorarioService } from '../../services/horario.service';
import { UsuarioService } from '../../services/usuario.service';
import { ConsultorioService } from '../../services/consultorio.service';
import { ConsultaService } from '../../services/consulta.service';
import { Usuario, TipoUsuario } from '../../models/usuario.model';
import { Consultorio } from '../../models/consultorio.model';
import { Consulta } from '../../models/consulta.model';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './horarios.component.html',
  styleUrls: ['./horarios.component.css']
})
export class HorariosComponent implements OnInit {
  horarios: Horario[] = [];
  horarioForm: FormGroup;
  editingHorario: Horario | null = null;
  showForm = false;
  loading = false;
  medicos: Usuario[] = [];
  consultorios: Consultorio[] = [];
  consultas: Consulta[] = [];
  errorMessage = '';
  successMessage = '';

  constructor(
    private horarioService: HorarioService,
    private usuarioService: UsuarioService,
    private consultorioService: ConsultorioService,
    private consultaService: ConsultaService,
    private fb: FormBuilder
  ) {
    this.horarioForm = this.fb.group({
      consultorio_id: ['', [Validators.required]],
      medico_id: ['', [Validators.required]],
      turno: ['', [Validators.required]],
      consulta_id: ['']
    });
  }

  ngOnInit(): void {
    this.loadHorarios();
    this.loadMedicos();
    this.loadConsultorios();
    this.loadConsultas();
  }

  loadHorarios(): void {
    this.loading = true;
    this.horarioService.getHorarios().subscribe({
      next: (horarios) => {
        this.horarios = horarios;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading horarios:', error);
        this.errorMessage = 'Error al cargar horarios';
        this.loading = false;
      }
    });
  }

  loadMedicos(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        // Corregir el filtro usando el enum TipoUsuario
        this.medicos = usuarios.filter(u => u.tipo === TipoUsuario.MEDICO);
      },
      error: (error) => {
        console.error('Error loading medicos:', error);
        this.errorMessage = 'Error al cargar médicos';
      }
    });
  }

  loadConsultorios(): void {
    this.consultorioService.getConsultorios().subscribe({
      next: (consultorios) => {
        this.consultorios = consultorios;
      },
      error: (error) => {
        console.error('Error loading consultorios:', error);
        this.errorMessage = 'Error al cargar consultorios';
      }
    });
  }

  loadConsultas(): void {
    this.consultaService.getConsultas().subscribe({
      next: (consultas) => {
        this.consultas = consultas;
      },
      error: (error) => {
        console.error('Error loading consultas:', error);
        this.errorMessage = 'Error al cargar consultas';
      }
    });
  }

  openCreateForm(): void {
    this.editingHorario = null;
    this.horarioForm.reset();
    this.showForm = true;
    this.clearMessages();
  }

  openEditForm(horario: Horario): void {
    this.editingHorario = horario;
    this.horarioForm.patchValue({
      consultorio_id: horario.consultorio_id,
      medico_id: horario.medico_id,
      turno: horario.turno,
      consulta_id: horario.consulta_id
    });
    this.showForm = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingHorario = null;
    this.horarioForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.horarioForm.valid) {
      const formValue = this.horarioForm.value;
      
      // Asegurar que los IDs sean números
      const horarioData: CreateHorarioRequest = {
        consultorio_id: parseInt(formValue.consultorio_id, 10),
        medico_id: parseInt(formValue.medico_id, 10),
        turno: formValue.turno,
        consulta_id: formValue.consulta_id ? parseInt(formValue.consulta_id, 10) : undefined
      };
      
      // Validar que los IDs sean números válidos
      if (isNaN(horarioData.consultorio_id)) {
        this.errorMessage = 'Debe seleccionar un consultorio válido';
        return;
      }
      
      if (isNaN(horarioData.medico_id)) {
        this.errorMessage = 'Debe seleccionar un médico válido';
        return;
      }
      
      if (this.editingHorario) {
        this.updateHorario(this.editingHorario.id_horario!, horarioData);
      } else {
        this.createHorario(horarioData);
      }
    } else {
      this.errorMessage = 'Por favor complete todos los campos requeridos';
    }
  }

  createHorario(horarioData: CreateHorarioRequest): void {
    this.horarioService.createHorario(horarioData).subscribe({
      next: (horario) => {
        this.horarios.push(horario);
        this.successMessage = 'Horario creado exitosamente';
        this.closeForm();
      },
      error: (error) => {
        console.error('Error creating horario:', error);
        this.errorMessage = error.error?.error || 'Error al crear horario';
      }
    });
  }

  updateHorario(id: number, horarioData: CreateHorarioRequest): void {
    this.horarioService.updateHorario(id, horarioData).subscribe({
      next: (horario) => {
        const index = this.horarios.findIndex(h => h.id_horario === id);
        if (index !== -1) {
          this.horarios[index] = horario;
        }
        this.successMessage = 'Horario actualizado exitosamente';
        this.closeForm();
      },
      error: (error) => {
        console.error('Error updating horario:', error);
        this.errorMessage = error.error?.error || 'Error al actualizar horario';
      }
    });
  }

  deleteHorario(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este horario?')) {
      this.horarioService.deleteHorario(id).subscribe({
        next: () => {
          this.horarios = this.horarios.filter(h => h.id_horario !== id);
          this.successMessage = 'Horario eliminado exitosamente';
        },
        error: (error) => {
          console.error('Error deleting horario:', error);
          this.errorMessage = error.error?.error || 'Error al eliminar horario';
        }
      });
    }
  }

  getMedicoNombre(medicoId: number): string {
    const medico = this.medicos.find(m => m.id_usuario === medicoId);
    return medico ? medico.nombre : 'N/A';
  }

  getConsultorioNombre(consultorioId: number): string {
    const consultorio = this.consultorios.find(c => c.id_consultorio === consultorioId);
    return consultorio ? consultorio.nombre : 'N/A';
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}