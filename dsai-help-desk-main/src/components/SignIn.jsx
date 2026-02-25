import React, { useState } from "react";
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Modal,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import apiClient from "../routes/apiService";

const SignIn = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const selectedUser = location.state?.user;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Modal state
    const [openModal, setOpenModal] = useState(false);
    const [regUsername, setRegUsername] = useState("");
    const [regPassword, setRegPassword] = useState("");

    const getDefaultRoute = (role) => {
    switch (role) {
        case "operator":
            return "/operator";
        case "instructor":
            return "/manager";
        case "support engineer":
            return "/analyst";
        case "admin":
            return "/admin";
        default:
            return "/operator";
    }
};
    const mapRoleToDisplay = (backendRole) => {
    switch (backendRole) {
        case "operator": return "Cyber Operator";
        case "instructor": return "Training Manager";
        case "support engineer": return "Help Desk Analyst";
        case "admin": return "Administrator";
        default: return backendRole;
    }
};

    const handleSubmit = async () => {
    if (!selectedUser) {
        navigate("/");
        return;
    }

    if (!username || !password) {
        alert("Enter username & password");
        return;
    }

    try {
        const response = await apiClient.post("/api/auth/login", {
            username,
            password,
        });

        const data = response.data;
        const returnedDisplayRole = mapRoleToDisplay(data.role);
            if (returnedDisplayRole !== selectedUser.role) {
                alert(
                    `Invalid credentials for ${selectedUser.role}. Please use correct username & password. or sign Up for a new account with the ${selectedUser.role} role.`
                );
                return;
            }

        // ✅ Save backend auth data
        login({
            username,
            role: mapRoleToDisplay(data.role),
            access_token: data.access_token,
            session_id: data.session_id,
        });

        navigate(getDefaultRoute(data.role));

    } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || "Login failed");
    }
};

const mapRoleToBackend = (role) => {
    switch (role) {
        case "Cyber Operator":
            return "operator";
        case "Training Manager":
            return "instructor";
        case "Help Desk Analyst":
            return "support engineer";
        case "Administrator":
            return "admin";
        default:
            return "operator";
    }
};

    const handleRegister = async () => {
    if (!regUsername || !regPassword) {
        alert("Enter registration details");
        return;
    }

    try {
        await apiClient.post("/api/auth/register", {
            username: regUsername,
            password: regPassword,
            role: mapRoleToBackend(selectedUser.role)
        });

        alert("✅ Registration successful!");
        setOpenModal(false);

    } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || "Registration failed");
    }
};

    return (
        <>
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#1a1a1a",
                }}
            >
                <Card
                    sx={{
                        width: 380,
                        px: 4,
                        py: 4,
                        backgroundColor: "#242424",
                        borderRadius: "6px",
                        border: "1px solid #D4AF37",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                    }}
                >
                    <Box display="flex" flexDirection="column">
                        <Typography
                            variant="h5"
                            align="center"
                            sx={{
                                color: "#D4AF37",
                                fontWeight: "bold",
                                mb: 2,
                            }}
                        >
                            Sign In
                        </Typography>

                        {selectedUser && (
                            <Typography
                                align="center"
                                sx={{ color: "#999999", mb: 3 }}
                            >
                                Login as {selectedUser.role}
                            </Typography>
                        )}

                        <TextField
                            fullWidth
                            label="Username"
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            InputLabelProps={{ style: { color: "#999999" } }}
                            InputProps={{ style: { color: "#E0E0E0" } }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputLabelProps={{ style: { color: "#999999" } }}
                            InputProps={{ style: { color: "#E0E0E0" } }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                backgroundColor: "#D4AF37",
                                color: "#1a1a1a",
                                fontWeight: 600,
                                "&:hover": { backgroundColor: "#E8C547" },
                            }}
                            onClick={handleSubmit}
                        >
                            Sign In
                        </Button>

                        {/* Sign Up Link */}
                        <Typography
                            align="center"
                            sx={{
                                mt: 2,
                                color: "#999999",
                                cursor: "pointer",
                                fontSize: "14px",
                                "&:hover": { color: "#D4AF37" },
                            }}
                            onClick={() => setOpenModal(true)}
                        >
                            Don’t have an account? Sign up
                        </Typography>
                    </Box>
                </Card>
            </Box>

            {/* SIGN UP MODAL */}
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 380,
                        backgroundColor: "#242424",
                        border: "1px solid #D4AF37",
                        borderRadius: "6px",
                        p: 4,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                    }}
                >
                    <IconButton
                        onClick={() => setOpenModal(false)}
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            color: "#999999",
                            "&:hover": {
                                color: "#D4AF37",
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        align="center"
                        sx={{ color: "#D4AF37", mb: 2 }}
                    >
                        Register
                    </Typography>

                    <TextField
                        fullWidth
                        label="Username"
                        margin="normal"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        slotProps={{
                            inputLabel: {
                                sx: { color: "#999999" },
                            },
                            input: {
                                sx: { color: "#E0E0E0" },
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        margin="normal"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        slotProps={{
                            inputLabel: {
                                sx: { color: "#999999" },
                            },
                            input: {
                                sx: { color: "#E0E0E0" },
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Role"
                        margin="normal"
                        value={selectedUser?.role || ""}
                        disabled
                        slotProps={{
                            inputLabel: {
                                sx: { color: "#999999" },
                            },
                            input: {
                                sx: { color: "#E0E0E0" },
                            },
                        }}
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            backgroundColor: "#D4AF37",
                            color: "#1a1a1a",
                            fontWeight: 600,
                            "&:hover": { backgroundColor: "#E8C547" },
                        }}
                        onClick={handleRegister}
                    >
                        Register
                    </Button>
                </Box>
            </Modal>
        </>
    );
};

export default SignIn;