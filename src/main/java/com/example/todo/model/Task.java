package com.example.todo.model;
import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private boolean completed;

    private LocalDateTime cratedAt;

    @PrePersist
    public void prePersist(){
        if(this.cratedAt == null){
            this.cratedAt = LocalDataTime.now();
        }
    }
    
    // Construtor vazio obrigatório para o JPA
    public Task() {
    }

    // Construtor opcional
    public Task(String title, boolean completed) {
        this.title = title;
        this.completed = completed;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    // Getters e Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
