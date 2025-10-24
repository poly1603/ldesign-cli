import { defineStore } from 'pinia'
import { ref } from 'vue'
import { projectsApi, type Project } from '../api/projects'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const loading = ref(false)

  async function fetchProjects() {
    loading.value = true
    try {
      projects.value = await projectsApi.getAll()
    } finally {
      loading.value = false
    }
  }

  async function fetchProject(id: string) {
    loading.value = true
    try {
      currentProject.value = await projectsApi.getById(id)
    } finally {
      loading.value = false
    }
  }

  async function importProject(path: string) {
    const project = await projectsApi.import(path)
    projects.value.unshift(project)
    return project
  }

  async function deleteProject(id: string) {
    await projectsApi.delete(id)
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  return {
    projects,
    currentProject,
    loading,
    fetchProjects,
    fetchProject,
    importProject,
    deleteProject,
  }
})


