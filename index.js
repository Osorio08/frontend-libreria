const librosSection = document.getElementById('libros');
const formularioLibroSection = document.getElementById('formulario-libro');
const formularioAutorSection = document.getElementById('formulario-autor');

let libroEditandoId = null;

const API_BASE_URL = 'https://backend-libreria-production-86b3.up.railway.app';

//Mostrar la sección seleccionada
function mostrarSeccion(seccion) {
  [librosSection, formularioLibroSection, formularioAutorSection].forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  seccion.classList.add('active');
  seccion.style.display = 'block';
}

//Marcar el botón seleccionado
function marcarBotonActivo(botonId) {
  const botones = document.querySelectorAll('.sidebar button');
  botones.forEach(b => b.classList.remove('active'));
  document.getElementById(botonId).classList.add('active');
}

//#region Botones Sidebar;
document.getElementById('btn-ver-libros').addEventListener('click', () => {
  mostrarSeccion(librosSection);
  marcarBotonActivo('btn-ver-libros');
});

document.getElementById('btn-agregar-libro').addEventListener('click', () => {
  libroEditandoId = null;
  document.getElementById('form-libro').reset();
  document.querySelector('#form-libro button[type="submit"]').textContent = 'Guardar';
  mostrarSeccion(formularioLibroSection);
  marcarBotonActivo('btn-agregar-libro');
});

document.getElementById('btn-agregar-autor').addEventListener('click', () => {
  document.getElementById('form-autor').reset();
  mostrarSeccion(formularioAutorSection);
  marcarBotonActivo('btn-agregar-autor');
});

//#endregion

//#region Libros;
//GET Libros
function cargarLibros() {
  fetch(`${API_BASE_URL}/api/libros`)
    .then(res => res.json())
    .then(libros => {
      const lista = document.getElementById('lista-libros');
      lista.innerHTML = '';
      libros.forEach(libro => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${libro.Titulo}</td>
          <td>${libro.Autor}</td>
          <td>${libro.Ano_Publicacion}</td>
          <td>${libro.Cantidad_Disponible}</td>
          <td>
            <button onclick="editarLibro(${libro.ID_Libro})">Editar</button>
            <button onclick="eliminarLibro(${libro.ID_Libro})">Eliminar</button>
          </td>
        `;
        lista.appendChild(row);
      });
    });
}


//POST Libros
document.getElementById('form-libro').addEventListener('submit', function (e) {
  e.preventDefault();

  const data = {
    titulo: document.getElementById('titulo').value,
    id_autor: document.getElementById('autor').value,
    ano_publicacion: document.getElementById('ano_publicacion').value,
    cantidad: document.getElementById('cantidad').value
  };

  //Si se esta editando un libro, se usa PUT, si no, se usa POST
  const url = libroEditandoId
    ? `${API_BASE_URL}/api/libros/${libroEditandoId}`
    : `${API_BASE_URL}/api/libros`;
  
  const method = libroEditandoId ? 'PUT' : 'POST';

  fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(() => {
      cargarLibros(); 
      mostrarSeccion(librosSection); 
      marcarBotonActivo('btn-ver-libros'); 
      document.getElementById('form-libro').reset(); 

      libroEditandoId = null;
      document.querySelector('#form-libro button[type="submit"]').textContent = 'Agregar Libro';
    });
});


//PUT Libros
function editarLibro(id) {
  fetch(`${API_BASE_URL}/api/libros`)
    .then(res => res.json())
    .then(libros => {
      const libro = libros.find(l => l.ID_Libro === id);
      if (!libro) return alert('Libro no encontrado');

      // Cargar autores primero
      cargarAutores().then(() => {
        const selectAutor = document.getElementById('autor');
        const idAutorStr = String(libro.ID_Autor); // Asegura comparación correcta

        // Buscar si el autor existe entre las opciones
        const opcionExiste = Array.from(selectAutor.options).some(opt => opt.value === idAutorStr);

        if (opcionExiste) {
          selectAutor.value = idAutorStr;
        } else {
          alert('El autor del libro no está en la lista de autores.');
        }

        document.getElementById('titulo').value = libro.Titulo;
        document.getElementById('ano_publicacion').value = libro.Ano_Publicacion;
        document.getElementById('cantidad').value = libro.Cantidad_Disponible;

        libroEditandoId = id;

        document.querySelector('#form-libro button[type="submit"]').textContent = 'Actualizar Libro';
        mostrarSeccion(formularioLibroSection);
        marcarBotonActivo('btn-agregar-libro');
      });
    })
    .catch(error => {
      console.error('Error al editar libro:', error);
    });
}

//DELETE Libros
function eliminarLibro(id) {
  if (!confirm('¿Estás seguro de eliminar este libro?')) return;

  fetch(`${API_BASE_URL}/api/libros/${id}`, {
    method: 'DELETE'
  })
    .then(res => res.json())
    .then(() => {
      cargarLibros();
    });
}
//#endregion

//#region Autores;
//GET Autores
function cargarAutores() {
  return fetch(`${API_BASE_URL}/api/autores`)
    .then(res => res.json())
    .then(autores => {
      console.log('Respuesta de /api/autores:', autores); 
      if (!Array.isArray(autores)) {
        throw new Error('La respuesta de /api/autores no es una lista válida');
      }

      const select = document.getElementById('autor');
      select.innerHTML = '';
      autores.forEach(autor => {
        const option = document.createElement('option');
        option.value = autor.ID_Autor;
        option.textContent = autor.NombreCompleto;
        select.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error al cargar autores:', error);
    });
}

//POST Autores
document.getElementById('form-autor').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre-autor').value.trim();
  const apellido = document.getElementById('apellido-autor').value.trim();
  const nacionalidad = document.getElementById('nacionalidad-autor').value.trim();

  const nombreCompleto = `${nombre} ${apellido}`;
   
  const nuevoAutor = {
    nombre: nombreCompleto,
    nacionalidad: nacionalidad
  };

  try {
  const res = await fetch(`${API_BASE_URL}/api/autores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoAutor)
  });

  if (res.ok) {
    alert('Autor agregado con éxito');
    document.getElementById('form-autor').reset();
    await cargarAutores();
  } else {
    const errorData = await res.json();
    alert('Error al agregar autor: ' + JSON.stringify(errorData));
  }
} catch (error) {
  console.error('Error en POST autor:', error);
}

});

//#endregion 


//Inicialización
window.addEventListener('DOMContentLoaded', () => {
  cargarAutores();
  cargarLibros();
  mostrarSeccion(librosSection);
  marcarBotonActivo('btn-ver-libros');
});
