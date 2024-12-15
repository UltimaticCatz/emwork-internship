import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [formData, setFormData] = useState({
    prefix: "นาย",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    profilePicture: null,
    age: "",
    lastModified: "",
  });
  const [savedData, setSavedData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [ageFrequency, setAgeFrequency] = useState({});
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:5000/users");
      if (!response.ok) {
        throw new Error(`error ${response.status}`);
      }
      const data = await response.json();
      setSavedData(data);
      calculateAgeFrequency(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const calculateAgeFrequency = (data) => {
    const frequency = {};
    data.forEach((user) => {
      const age = parseInt(user.age, 10);
      frequency[age] = (frequency[age] || 0) + 1;
    });
    setAgeFrequency(frequency);
  };

  const chartData = {
    labels: Object.keys(ageFrequency).map((age) => `อายุ  ${age}`),
    datasets: [
      {
        label: "จํานวนบุคคล",
        data: Object.values(ageFrequency),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Age Distribution",
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lastModified = new Date().toISOString().slice(0, 19).replace("T", " "); //make it compatible with mysql 

    const dataToSend = {
      ...formData,
      lastModified,
    };

    try {
      const formDataWithFile = new FormData();
      Object.entries(dataToSend).forEach(([key, value]) => {
        if (key === "profilePicture" && value) {
          formDataWithFile.append(key, value);
        } else {
          formDataWithFile.append(key, value);
        }
      });

      const response = await fetch("http://localhost:5000/users/registerUser", {
        method: "POST",
        body: formDataWithFile,
      });

      if (!response.ok) {
        throw new Error(`error ${response.status}`);
      }

      const updatedResponse = await fetch("http://localhost:5000/users");
      if (!updatedResponse.ok) {
        throw new Error(`HTTP error! status: ${updatedResponse.status}`);
      }
      const updatedData = await updatedResponse.json();
      setSavedData(updatedData);
      calculateAgeFrequency(updatedData)
    } catch (error) {
      console.error("Error submitting data: ", error);
    }


  };
  
    
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    //if input is dateofbirth
    if (name === "dateOfBirth") {
      const age = calculateAge(value);
      setFormData((prevData) => ({ ...prevData, age }));
    }
  }

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFormData((prevData) => ({
      ...prevData,
      profilePicture: file,
    }));
  }


  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = () => {
    const sortedData = [...savedData].sort((a, b) => {
      return sortOrder === "asc" ? a.age - b.age : b.age - a.age;
    });
    setSavedData(sortedData);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const filteredData = savedData.filter((user) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  


  return (
    <div style={{ maxWidth: "600px", padding: "20px" }}>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name Prefix:</label>
          <select name="prefix" value={formData.prefix} onChange={handleChange}>
            <option value="นาย">นาย</option>
            <option value="นาง">นาง</option>
            <option value="นางสาว">นางสาว</option>
          </select>
        </div>

        <div>
          <label>First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Date of Birth:</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Age:</label>
          <input type="text" value={formData.age} readOnly />
        </div>

        <div>
          <label>Profile Picture:</label>
          <input type="file" accept="image/*" onChange={handleFileUpload} />
        </div>

        <button type="submit">Submit</button>
      </form>
      <h2>กราฟ</h2>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <h1>Age Distribution</h1>
          <Bar data={chartData} options={chartOptions} />
        </div>
      <h2>รายงาน</h2>
        <ul>
          {Object.entries(ageFrequency).map(([age, count]) => (
            <li key={age}>
              อายุ {age}: {count} คน
            </li>
          ))}
        </ul>
      <h2>รายการ</h2>
      <div>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <button onClick={handleSort}>
          เรียงลําดับตามอายุ ({sortOrder === "asc" ? "น้อยไปมาก" : "มากไปน้อย"})
        </button>
      </div>
      <ul>
        {filteredData.map((user, index) => (
          <li key={index}>
            <ol>
            {user.profilePicture && (
            <img 
              src={`http://localhost:5000${user.profilePicture}`} 
              alt={`${user.firstName} ${user.lastName}'s profile`} 
              style={{ width: "100px", height: "100px", borderRadius: "50%" }} 
            />
          )}
            <h2>{user.prefix} {user.firstName} {user.lastName}</h2>
            <p>วันเกิด {user.dateOfBirth.slice(0,10)} อายุ: {user.age}</p>
            <p>last modified {user.lastModified.replace("T", " ")}</p>
            </ol>
          </li>
        ))}
      </ul>

    </div>
  );
}


export default App;
