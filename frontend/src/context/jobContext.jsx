import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../api";

export const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);

  const normalizeJobs = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((it) => {
      const copy = { ...it };
      if (!copy._id && copy.id) copy._id = copy.id.$oid ?? copy.id;
      if (copy._id && typeof copy._id === "object") copy._id = copy._id.$oid ?? copy._id;
      copy.status = (copy.status || "").toString().toLowerCase();
      return copy;
    });
  };

  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get(`/jobs?all=true`);
      const arrJobs = res.data?.services || res.data?.jobs || (Array.isArray(res.data) ? res.data : []);
      const normalized = normalizeJobs(arrJobs);
      setJobs(normalized);
      return normalized;
    } catch (err) {
      console.error("JobContext fetchJobs error:", err?.response?.data ?? err.message);
      setJobs([]);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const addJob = async (formData) => {
    try {
      const res = await api.post(`/jobs`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const created = res.data?.service || res.data?.job || res.data;
      if (created) {
        const normalized = normalizeJobs([created]);
        setJobs((prev) => [...normalized, ...(Array.isArray(prev) ? prev : [])]);
      }
      return created;
    } catch (err) {
      console.error("JobContext addJob error:", err?.response?.data ?? err.message);
      throw err;
    }
  };

  return (
    <JobContext.Provider value={{ jobs, addJob, fetchJobs }}>
      {children}
    </JobContext.Provider>
  );
};