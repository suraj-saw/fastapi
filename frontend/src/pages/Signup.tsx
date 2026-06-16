import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import API from "../api/axios";

interface SignupForm {

    username:string;
    email:string;
    password:string;

}

function Signup(){
    const navigate = useNavigate();
    const [form,setForm] = useState<SignupForm>({
        username:"",
        email:"",
        password:""
    });

    const handleChange = 
    (e:ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,

            [e.target.name]:
            e.target.value

        });
    };
    const handleSubmit = 
    async(e:FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        try{
            await API.post(
                "/auth/register",
                form
            );
            alert(
                "Account created successfully"
            );

            navigate("/login");
        }
        catch(error:any){
            alert(
                error.response?.data?.detail
                ||
                "Signup failed"
            );
        }
    };

return (
<div className="container">
<h2>Create Account</h2>
<form onSubmit={handleSubmit}>
<input
type="text"
name="username"
placeholder="Username"
onChange={handleChange}
/>

<input
type="email"
name="email"
placeholder="Email"
onChange={handleChange}
/>
<input
type="password"
name="password"
placeholder="Password"
onChange={handleChange}
/>

<button type="submit">
Signup
</button>

</form>

<p>
Already registered?

<Link to="/login">

 Login

</Link>


</p>



</div>

);

}


export default Signup;